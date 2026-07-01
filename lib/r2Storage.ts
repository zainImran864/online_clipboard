import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

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
