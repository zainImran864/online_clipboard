import { NextResponse } from 'next/server';
import { createR2StorageKey, getR2PublicUrl, uploadToR2 } from '@/lib/r2Storage';

export const runtime = 'nodejs';

/**
 * Stores oversized clip text in Cloudflare R2.
 *
 * Firestore documents are capped at ~1 MiB, so text larger than the inline
 * threshold cannot live in the clip document. There is no daily quota here:
 * per product requirements, text has no size limit (unlike file uploads).
 */
export async function POST(request: Request) {
    try {
        const { text } = await request.json();

        if (typeof text !== 'string' || text.length === 0) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        const storageKey = createR2StorageKey('clip-text.txt');

        await uploadToR2({
            storageKey,
            body: Buffer.from(text, 'utf-8'),
            contentType: 'text/plain; charset=utf-8',
        });

        return NextResponse.json({
            url: getR2PublicUrl(storageKey),
            storageKey,
            storageProvider: 'r2',
        });
    } catch (error) {
        console.error('Text upload failed:', error);
        const message = error instanceof Error ? error.message : 'Failed to store text';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
