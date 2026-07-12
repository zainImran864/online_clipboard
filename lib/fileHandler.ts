import { isAllowedFile } from './allowedFiles';

export type StorageProvider = 'firebase-inline' | 'r2';

export interface FileUploadResult {
    url: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    storageProvider: StorageProvider;
    storageKey?: string;
}

export interface UploadFileOptions {
    onProgress?: (progress: number) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILE_SIZE_MESSAGE = "You can't upload files larger than 10MB.";

function parseUploadResponse(xhr: XMLHttpRequest): FileUploadResult {
    let result: { error?: string } & Partial<FileUploadResult>;

    try {
        result = JSON.parse(xhr.responseText || '{}');
    } catch {
        throw new Error(
            xhr.status >= 200 && xhr.status < 300
                ? 'Upload failed. Please try again.'
                : 'Upload failed. Files must be 10MB or less.'
        );
    }

    if (xhr.status < 200 || xhr.status >= 300) {
        throw new Error(result.error || 'Failed to upload file');
    }

    return result as FileUploadResult;
}

async function uploadFileThroughServer(file: File, options: UploadFileOptions = {}): Promise<FileUploadResult> {
    // Guard here too, not just in the UI — a file large enough to route to R2
    // must still never exceed the 10MB cap.
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(MAX_FILE_SIZE_MESSAGE);
    }

    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open('POST', '/api/files/upload');

        xhr.upload.onprogress = (event) => {
            if (!event.lengthComputable) return;
            const progress = Math.max(1, Math.min(99, Math.round((event.loaded / event.total) * 100)));
            options.onProgress?.(progress);
        };

        xhr.onload = () => {
            try {
                if (xhr.status === 413) {
                    throw new Error(MAX_FILE_SIZE_MESSAGE);
                }

                const result = parseUploadResponse(xhr);
                options.onProgress?.(100);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        };

        xhr.onerror = () => reject(new Error('Upload failed. Please check your connection and try again.'));
        xhr.onabort = () => reject(new Error('Upload cancelled.'));

        options.onProgress?.(1);
        xhr.send(formData);
    });
}

/**
 * Routes files to Firestore inline storage or Cloudflare R2 by size.
 * @param file - The file to upload
 * @param code - The clip code, kept for compatibility with existing callers
 */
export async function uploadFile(file: File, code: string, options: UploadFileOptions = {}): Promise<FileUploadResult> {
    void code;

    return uploadFileThroughServer(file, options);
}

/**
 * Validates file type and size
 * @param file - The file to validate
 * @returns boolean - Whether the file is valid
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: MAX_FILE_SIZE_MESSAGE,
        };
    }

    if (!isAllowedFile(file.name, file.type)) {
        return {
            valid: false,
            error: 'File type not supported. Please upload text, code, archives, Office, PDF, image, audio, or video files.',
        };
    }

    return { valid: true };
}