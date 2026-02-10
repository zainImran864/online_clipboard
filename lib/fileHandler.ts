export interface FileUploadResult {
    url: string; // base64 data URL
    fileName: string;
    fileType: string;
    fileSize: number;
}

/**
 * Converts a file to base64 data URL (stores in Firestore, not Storage)
 * @param file - The file to convert
 * @param code - The clip code (not used for base64, kept for compatibility)
 * @returns Promise<FileUploadResult> - Result with base64 URL and metadata
 */
export async function uploadFile(file: File, code: string): Promise<FileUploadResult> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const base64String = reader.result as string;

            resolve({
                url: base64String, // base64 data URL (e.g., data:image/png;base64,...)
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
            });
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        // Read file as data URL (base64)
        reader.readAsDataURL(file);
    });
}

/**
 * Validates file type and size
 * @param file - The file to validate
 * @returns boolean - Whether the file is valid
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
    // Reduced max size for base64 storage (Firestore has 1MB document limit)
    const MAX_FILE_SIZE = 800 * 1024; // 800KB (to account for base64 encoding overhead)
    const ALLOWED_TYPES = [
        'text/plain',
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
    ];

    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: 'File size must be less than 800KB for direct storage',
        };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: 'File type not supported. Please upload text, PDF, or image files.',
        };
    }

    return { valid: true };
}
