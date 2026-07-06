import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let r2Client: S3Client | null = null;

function getRequiredEnv(name: string) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is not configured`);
    }
    return value;
}

function getR2Client() {
    if (r2Client) return r2Client;

    const accountId = getRequiredEnv('CLOUDFLARE_ACCOUNT_ID');

    r2Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: getRequiredEnv('R2_ACCESS_KEY_ID'),
            secretAccessKey: getRequiredEnv('R2_SECRET_ACCESS_KEY'),
        },
    });

    return r2Client;
}

function sanitizeFileName(fileName: string) {
    return fileName
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 120);
}

export function createR2StorageKey(fileName: string) {
    const safeName = sanitizeFileName(fileName) || 'file';
    return `clips/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;
}

/**
 * Storage key for a gated "secret share" upload. Lives under a dedicated
 * `secure/` prefix with an unguessable UUID so the object cannot be discovered
 * by enumeration even though the bucket allows public reads.
 */
export function createSecureStorageKey(fileName: string) {
    const safeName = sanitizeFileName(fileName) || 'file';
    return `secure/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;
}

export function getR2PublicUrl(storageKey: string) {
    const publicUrl = getRequiredEnv('R2_PUBLIC_URL').replace(/\/$/, '');
    return `${publicUrl}/${storageKey}`;
}

export async function uploadToR2(params: {
    storageKey: string;
    body: Buffer;
    contentType?: string;
}) {
    await getR2Client().send(
        new PutObjectCommand({
            Bucket: getRequiredEnv('R2_BUCKET_NAME'),
            Key: params.storageKey,
            Body: params.body,
            ContentType: params.contentType || 'application/octet-stream',
        })
    );
}

export async function deleteFromR2(storageKey: string) {
    await getR2Client().send(
        new DeleteObjectCommand({
            Bucket: getRequiredEnv('R2_BUCKET_NAME'),
            Key: storageKey,
        })
    );
}

/**
 * Creates a presigned PUT URL that lets the browser upload directly to R2,
 * bypassing the Vercel request-body limit.
 *
 * R2 does NOT support presigned POST (form) uploads — it returns 501 Not
 * Implemented — so we use PUT. Content-Type is intentionally left unsigned so
 * the browser's PUT doesn't have to match a signed header; the object's type
 * is taken from the request header the client sends. The 600MB cap can't be
 * enforced in the signature here, so it's re-checked server-side in /finalize
 * via a HEAD (oversized uploads are deleted).
 */
export async function createPresignedUploadUrl(params: {
    storageKey: string;
    expiresSeconds?: number;
}): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: getRequiredEnv('R2_BUCKET_NAME'),
        Key: params.storageKey,
    });

    return getSignedUrl(getR2Client(), command, {
        expiresIn: params.expiresSeconds ?? 30 * 60,
    });
}

/**
 * Short-lived presigned GET URL for downloading a secure object. Preferred over
 * the permanent public URL so a leaked link stops working quickly.
 */
export async function createPresignedDownloadUrl(
    storageKey: string,
    fileName?: string,
    expiresSeconds = 15 * 60
) {
    const command = new GetObjectCommand({
        Bucket: getRequiredEnv('R2_BUCKET_NAME'),
        Key: storageKey,
        ...(fileName
            ? { ResponseContentDisposition: `attachment; filename="${sanitizeFileName(fileName)}"` }
            : {}),
    });

    return getSignedUrl(getR2Client(), command, { expiresIn: expiresSeconds });
}

/**
 * Returns the real byte size of an uploaded object, or null if it does not
 * exist. Used to confirm a direct browser upload actually landed and to
 * re-check the size server-side before finalizing.
 */
export async function getR2ObjectSize(storageKey: string): Promise<number | null> {
    try {
        const head = await getR2Client().send(
            new HeadObjectCommand({
                Bucket: getRequiredEnv('R2_BUCKET_NAME'),
                Key: storageKey,
            })
        );
        return typeof head.ContentLength === 'number' ? head.ContentLength : null;
    } catch {
        return null;
    }
}
