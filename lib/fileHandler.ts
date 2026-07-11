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

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILE_SIZE_MESSAGE = "You can't upload files larger than 10MB.";

async function uploadFileThroughServer(file: File): Promise<FileUploadResult> {
    // Guard here too, not just in the UI — a file large enough to route to R2
    // must still never exceed the 10MB cap.
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(MAX_FILE_SIZE_MESSAGE);
    }

    const formData = new FormData();
    formData.append('file', file);

    let response: Response;
    try {
        response = await fetch('/api/files/upload', {
            method: 'POST',
            body: formData,
        });
    } catch {
        throw new Error('Upload failed. Please check your connection and try again.');
    }

    // A body over the server/platform request-size limit comes back as a
    // non-JSON error page (413), so parsing would throw. Surface the size cap.
    if (response.status === 413) {
        throw new Error(MAX_FILE_SIZE_MESSAGE);
    }

    let result: { error?: string } & Partial<FileUploadResult>;
    try {
        result = await response.json();
    } catch {
        throw new Error(
            response.ok
                ? 'Upload failed. Please try again.'
                : 'Upload failed. Files must be 10MB or less.'
        );
    }

    if (!response.ok) {
        throw new Error(result.error || 'Failed to upload file');
    }

    return result as FileUploadResult;
}

/**
 * Routes files to Firestore inline storage or Cloudflare R2 by size.
 * @param file - The file to upload
 * @param code - The clip code, kept for compatibility with existing callers
 */
export async function uploadFile(file: File, code: string): Promise<FileUploadResult> {
    void code;

    return uploadFileThroughServer(file);
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
