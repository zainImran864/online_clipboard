import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface FileUploadResult {
    url: string;
    fileName: string;
    fileType: string;
    fileSize: number;
}

/**
 * Uploads a file to Firebase Storage
 * @param file - The file to upload
 * @param code - The clip code to organize files
 * @returns Promise<FileUploadResult> - Upload result with URL and metadata
 */
export async function uploadFile(file: File, code: string): Promise<FileUploadResult> {
    const timestamp = Date.now();
    const fileName = `${code}_${timestamp}_${file.name}`;
    const storageRef = ref(storage, `clips/${fileName}`);

    // Upload file
    await uploadBytes(storageRef, file);

    // Get download URL
    const url = await getDownloadURL(storageRef);

    return {
        url,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
    };
}

/**
 * Validates file type and size
 * @param file - The file to validate
 * @returns boolean - Whether the file is valid
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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
            error: 'File size must be less than 10MB',
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
