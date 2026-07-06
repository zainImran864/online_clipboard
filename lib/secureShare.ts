import type { PresignedPost } from '@aws-sdk/s3-presigned-post';

// Gated "secret share" limits. Files up to 600 MB, kept for 6 hours, then the
// cron sweep deletes the R2 object and its Firestore record.
export const SECURE_MAX_FILE_SIZE = 600 * 1024 * 1024;
export const SECURE_EXPIRATION_MS = 6 * 60 * 60 * 1000;

export const ACCESS_CODE_LENGTH = 8;
export const SEND_CODE_LENGTH = 8;

export interface SecureAuthorizeResult {
    storageKey: string;
    post: PresignedPost;
}

export interface SecureDownloadResult {
    url: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    expiresAt: string;
}

async function readError(response: Response, fallback: string) {
    try {
        const data = await response.json();
        return data?.error || fallback;
    } catch {
        return fallback;
    }
}

/**
 * Full client-side secret-share upload flow:
 *   1. authorize the access code + get a presigned POST
 *   2. upload the file directly to R2 (bypasses the Vercel body limit)
 *   3. finalize — burns the one-time code and mints a send code
 * `onProgress` reports 0..1 during the direct upload.
 */
export async function uploadSecureFile(
    accessCode: string,
    file: File,
    onProgress?: (fraction: number) => void
): Promise<{ sendCode: string }> {
    const contentType = file.type || 'application/octet-stream';

    const authorizeRes = await fetch('/api/secure/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            accessCode,
            fileName: file.name,
            fileType: contentType,
            fileSize: file.size,
        }),
    });

    if (!authorizeRes.ok) {
        throw new Error(await readError(authorizeRes, 'Invalid or already-used secret code'));
    }

    const { storageKey, post } = (await authorizeRes.json()) as SecureAuthorizeResult;

    await uploadToPresignedPost(post, file, onProgress);

    const finalizeRes = await fetch('/api/secure/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            accessCode,
            storageKey,
            fileName: file.name,
            fileType: contentType,
            fileSize: file.size,
        }),
    });

    if (!finalizeRes.ok) {
        throw new Error(await readError(finalizeRes, 'Failed to finalize upload'));
    }

    return (await finalizeRes.json()) as { sendCode: string };
}

function uploadToPresignedPost(
    post: PresignedPost,
    file: File,
    onProgress?: (fraction: number) => void
): Promise<void> {
    return new Promise((resolve, reject) => {
        const form = new FormData();
        Object.entries(post.fields).forEach(([key, value]) => form.append(key, value));
        form.append('file', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', post.url, true);

        xhr.upload.onprogress = (event) => {
            if (onProgress && event.lengthComputable) {
                onProgress(event.loaded / event.total);
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(new Error(`Upload failed (${xhr.status}). The file may exceed the 600MB limit.`));
            }
        };

        xhr.onerror = () => reject(new Error('Upload failed. Please check your connection and try again.'));
        xhr.send(form);
    });
}

/** Resolves a send code to a short-lived download URL. Single fetch — no live updates. */
export async function fetchSecureDownload(sendCode: string): Promise<SecureDownloadResult> {
    const response = await fetch('/api/secure/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendCode }),
    });

    if (!response.ok) {
        throw new Error(await readError(response, 'Code not found or expired'));
    }

    return (await response.json()) as SecureDownloadResult;
}
