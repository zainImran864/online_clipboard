import { NextResponse } from 'next/server';
import { createR2StorageKey, getR2PublicUrl, uploadToR2 } from '@/lib/r2Storage';
import { isAllowedFile } from '@/lib/allowedFiles';

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

        if (!isAllowedFile(file.name, file.type)) {
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
