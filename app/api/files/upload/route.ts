import { NextResponse } from 'next/server';
import { createR2StorageKey, getR2PublicUrl, uploadToR2 } from '@/lib/r2Storage';

export const runtime = 'nodejs';

// Max size of the base64 data URL that may be stored inline in the Firestore
// clip document. This is the ENCODED size (what actually gets written), not the
// raw file size — base64 inflates the payload ~33%, and a Firestore document is
// hard-capped at 1 MiB total. Kept well under that cap to leave room for the
// rest of the document (metadata, and any inline text on a 'both' clip).
// Anything larger is offloaded to R2 so the advertised 10MB limit always holds.
const INLINE_FIRESTORE_LIMIT = 500 * 1024;
// Per-file hard limit. There is no daily/total quota — only this per-upload cap.
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
    'image/x-icon',
    'image/vnd.microsoft.icon',
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
    '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.zip',
    '.rar', '.tar', '.gz', '.tgz', '.csv', '.cvs', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.mp3', '.wav', '.ogg', '.oga', '.m4a', '.aac', '.flac', '.opus', '.weba', '.mid', '.midi',
    '.mp4', '.webm', '.ogv', '.mov', '.avi', '.mkv', '.mpeg', '.mpg', '.3gp', '.flv', '.wmv', '.m4v',
];

function validateFile(file: File) {
    const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const isAllowedType = ALLOWED_TYPES.includes(file.type);
    const isAllowedExt = ALLOWED_EXTENSIONS.includes(fileExt);
    const isEmptyMimeType = !file.type || file.type === '';

    return isAllowedType || isAllowedExt || isEmptyMimeType;
}

function arrayBufferToDataUrl(arrayBuffer: ArrayBuffer, contentType: string) {
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return `data:${contentType};base64,${base64}`;
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!(file instanceof File)) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!validateFile(file)) {
            return NextResponse.json(
                { error: 'File type not supported. Please upload text, code, archives, Office, PDF, image, audio, or video files.' },
                { status: 400 }
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "You can't upload files larger than 10MB." }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const fileType = file.type || 'application/octet-stream';

        // Decide inline-vs-R2 on the encoded size that will actually be written
        // to Firestore, not the raw file size — see INLINE_FIRESTORE_LIMIT.
        const inlineDataUrl = arrayBufferToDataUrl(arrayBuffer, fileType);

        if (Buffer.byteLength(inlineDataUrl) <= INLINE_FIRESTORE_LIMIT) {
            return NextResponse.json({
                url: inlineDataUrl,
                fileName: file.name,
                fileType,
                fileSize: file.size,
                storageProvider: 'firebase-inline',
            });
        }

        const storageKey = createR2StorageKey(file.name);

        await uploadToR2({
            storageKey,
            body: Buffer.from(arrayBuffer),
            contentType: fileType,
        });

        return NextResponse.json({
            url: getR2PublicUrl(storageKey),
            fileName: file.name,
            fileType,
            fileSize: file.size,
            storageProvider: 'r2',
            storageKey,
        });
    } catch (error) {
        console.error('File upload failed:', error);
        const message = error instanceof Error ? error.message : 'Failed to upload file';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
