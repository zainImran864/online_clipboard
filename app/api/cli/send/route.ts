import { NextResponse } from 'next/server';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateUniqueCode } from '@/lib/codeGenerator';
import { createR2StorageKey, getR2PublicUrl, uploadToR2 } from '@/lib/r2Storage';

export const runtime = 'nodejs';

const TEXT_INLINE_LIMIT = 100 * 1024; // 100 KB
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

/**
 * POST /api/cli/send
 * Handles CLI & Desktop uploads for text or files.
 * Accepts application/json (for text) or multipart/form-data (for files).
 */
export async function POST(request: Request) {
    try {
        const contentType = request.headers.get('content-type') || '';
        let clipType: 'text' | 'files' = 'text';
        let textContent = '';
        let fileItem: {
            name: string;
            size: number;
            type: string;
            url: string;
            storageKey: string;
            storageProvider: string;
        } | null = null;

        let expiryHours = 24;
        let accessPin: string | null = null;
        let deletePin: string | null = null;

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const file = formData.get('file') as File | null;
            const text = formData.get('text') as string | null;
            const exp = formData.get('expiryHours') as string | null;
            const pin = formData.get('accessPin') as string | null;
            const delPin = formData.get('deletePin') as string | null;

            if (exp) expiryHours = Math.max(1, Math.min(72, Number(exp) || 24));
            if (pin && typeof pin === 'string' && pin.trim().length === 4) {
                accessPin = pin.trim().toLowerCase();
            }
            if (delPin && typeof delPin === 'string' && delPin.trim().length > 0) {
                deletePin = delPin.trim();
            }

            if (file && file.size > 0) {
                if (file.size > MAX_FILE_SIZE) {
                    return NextResponse.json(
                        { error: `File exceeds maximum allowed size of 100 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB provided)` },
                        { status: 400 }
                    );
                }

                clipType = 'files';
                const fileBuffer = Buffer.from(await file.arrayBuffer());
                const storageKey = createR2StorageKey(file.name || 'uploaded_file');

                await uploadToR2({
                    storageKey,
                    body: fileBuffer,
                    contentType: file.type || 'application/octet-stream',
                });

                fileItem = {
                    name: file.name || 'unnamed_file',
                    size: file.size,
                    type: file.type || 'application/octet-stream',
                    url: getR2PublicUrl(storageKey),
                    storageKey,
                    storageProvider: 'r2',
                };
            } else if (text && text.trim().length > 0) {
                clipType = 'text';
                textContent = text;
            } else {
                return NextResponse.json({ error: 'No file or text provided in payload' }, { status: 400 });
            }
        } else {
            // JSON body
            const body = await request.json();
            const { text, expiryHours: exp, accessPin: pin, deletePin: delPin } = body;

            if (!text || typeof text !== 'string' || text.trim().length === 0) {
                return NextResponse.json({ error: 'Valid text content is required' }, { status: 400 });
            }

            textContent = text;
            clipType = 'text';

            if (exp) expiryHours = Math.max(1, Math.min(72, Number(exp) || 24));
            if (pin && typeof pin === 'string' && pin.trim().length === 4) {
                accessPin = pin.trim().toLowerCase();
            }
            if (delPin && typeof delPin === 'string' && delPin.trim().length > 0) {
                deletePin = delPin.trim();
            }
        }

        // Generate unique 6-digit share code
        const code = await generateUniqueCode();
        const now = Date.now();
        const expiresAt = new Date(now + expiryHours * 3600 * 1000);

        // Build document
        const docPayload: Record<string, unknown> = {
            code,
            type: clipType,
            createdAt: Timestamp.fromMillis(now),
            expiresAt: Timestamp.fromDate(expiresAt),
            deletePin: deletePin || null,
            accessPin: accessPin || null,
            views: 0,
            source: 'cli',
        };

        if (clipType === 'text') {
            const byteSize = new TextEncoder().encode(textContent).length;
            if (byteSize > TEXT_INLINE_LIMIT) {
                const storageKey = createR2StorageKey('clip-text.txt');
                await uploadToR2({
                    storageKey,
                    body: Buffer.from(textContent, 'utf-8'),
                    contentType: 'text/plain; charset=utf-8',
                });
                docPayload.content = getR2PublicUrl(storageKey);
                docPayload.textStorageProvider = 'r2';
                docPayload.textStorageKey = storageKey;
            } else {
                docPayload.content = textContent;
            }
        } else if (clipType === 'files' && fileItem) {
            docPayload.files = [fileItem];
        }

        await addDoc(collection(db, 'clips'), docPayload);

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pasteport.zain-imran.com';
        const viewUrl = `${baseUrl.replace(/\/$/, '')}/view/${code}`;

        return NextResponse.json({
            success: true,
            code,
            url: viewUrl,
            type: clipType,
            expiresAt: expiresAt.toISOString(),
            expiresInHours: expiryHours,
            hasAccessPin: Boolean(accessPin),
            hasDeletePin: Boolean(deletePin),
            file: fileItem
                ? {
                      name: fileItem.name,
                      size: fileItem.size,
                      type: fileItem.type,
                  }
                : undefined,
        });
    } catch (error) {
        console.error('CLI send endpoint error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
