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

async function uploadFileThroughServer(file: File): Promise<FileUploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
        const remainingBytes =
            typeof result.remainingBytes === 'number'
                ? ` ${Math.max(0, result.remainingBytes / (1024 * 1024)).toFixed(2)}MB remaining today.`
                : '';
        throw new Error(`${result.error || 'Failed to upload file'}${remainingBytes}`);
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
        '.rar', '.csv', '.cvs', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.mp3', '.wav', '.ogg', '.oga', '.m4a', '.aac', '.flac', '.opus', '.weba', '.mid', '.midi',
        '.mp4', '.webm', '.ogv', '.mov', '.avi', '.mkv', '.mpeg', '.mpg', '.3gp', '.flv', '.wmv', '.m4v'
    ];

    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: 'File size must be 10MB or less',
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
