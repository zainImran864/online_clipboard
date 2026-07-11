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
    const ALLOWED_TYPES = [
        'text/plain',
        'text/html',
        'text/css',
        'text/javascript',
        'text/xml',
        'text/csv',
        'text/markdown',
        'application/pdf',
        'application/json',
        'application/javascript',
        'application/xml',
        'application/x-javascript',
        'application/x-python-code',
        'application/zip',
        'application/x-zip-compressed',
        'multipart/x-zip',
        'application/vnd.rar',
        'application/x-rar-compressed',
        'application/gzip',
        'application/x-gzip',
        'application/x-tar',
        'application/x-gtar',
        'application/x-compressed-tar',
        'application/x-tgz',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/x-wav',
        'audio/ogg',
        'audio/webm',
        'audio/mp4',
        'audio/x-m4a',
        'audio/aac',
        'audio/flac',
        'audio/x-flac',
        'audio/opus',
        'audio/midi',
        'audio/x-midi',
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-matroska',
        'video/mpeg',
        'video/3gpp',
        'video/x-flv',
        'video/x-ms-wmv',
    ];

    const ALLOWED_EXTENSIONS = [
        '.txt', '.html', '.htm', '.css', '.js', '.jsx', '.ts', '.tsx',
        '.json', '.xml', '.md', '.py', '.java', '.c', '.cpp', '.h',
        '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.sql',
        '.sh', '.bash', '.yml', '.yaml', '.env', '.gitignore', '.conf',
        '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.zip',
        '.rar', '.tar', '.gz', '.tgz', '.csv', '.cvs', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.mp3', '.wav', '.ogg', '.oga', '.m4a', '.aac', '.flac', '.opus', '.weba', '.mid', '.midi',
        '.mp4', '.webm', '.ogv', '.mov', '.avi', '.mkv', '.mpeg', '.mpg', '.3gp', '.flv', '.wmv', '.m4v'
    ];

    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: MAX_FILE_SIZE_MESSAGE,
        };
    }

    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    const isAllowedType = ALLOWED_TYPES.includes(file.type);
    const isAllowedExt = ALLOWED_EXTENSIONS.includes(fileExt);
    const isEmptyMimeType = !file.type || file.type === '';

    if (!isAllowedType && !isAllowedExt && !isEmptyMimeType) {
        return {
            valid: false,
            error: 'File type not supported. Please upload text, code, archives, Office, PDF, image, audio, or video files.',
        };
    }

    return { valid: true };
}
