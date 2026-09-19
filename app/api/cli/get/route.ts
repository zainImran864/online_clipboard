import { NextResponse } from 'next/server';
import { collection, getDocs, query, where, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const runtime = 'nodejs';

/**
 * GET /api/cli/get?code=482193&pin=1234&raw=true
 * Retrieves clip data for CLI consumers.
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const pin = searchParams.get('pin');
        const isRaw = searchParams.get('raw') === 'true' || searchParams.get('raw') === '1';

        if (!code || typeof code !== 'string') {
            return NextResponse.json({ error: 'Valid 6-digit clip code is required' }, { status: 400 });
        }

        const clipsRef = collection(db, 'clips');
        const q = query(clipsRef, where('code', '==', code.trim()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return NextResponse.json({ error: `Clip "${code}" not found or already deleted` }, { status: 404 });
        }

        const clipDoc = querySnapshot.docs[0];
        const data = clipDoc.data();

        // Check expiration
        if (data.expiresAt && data.expiresAt.toMillis() <= Date.now()) {
            return NextResponse.json({ error: `Clip "${code}" has expired and is no longer available` }, { status: 410 });
        }

        // Check Access PIN if set
        if (data.accessPin) {
            if (!pin) {
                return NextResponse.json(
                    {
                        error: 'This clip is protected by a 4-character PIN',
                        pinRequired: true,
                        code,
                    },
                    { status: 401 }
                );
            }

            const normalizedEntered = String(pin).trim().toLowerCase();
            const normalizedStored = String(data.accessPin).trim().toLowerCase();

            if (normalizedEntered !== normalizedStored) {
                return NextResponse.json(
                    {
                        error: 'Incorrect PIN provided for this clip',
                        pinRequired: true,
                        code,
                    },
                    { status: 403 }
                );
            }
        }

        // Increment view count asynchronously
        void updateDoc(clipDoc.ref, { views: increment(1) }).catch(() => {});

        // Resolve text content if stored in R2
        let resolvedText = data.content || data.textContent || '';
        if (data.textStorageProvider === 'r2' && data.content) {
            try {
                const r2Res = await fetch(data.content);
                if (r2Res.ok) {
                    resolvedText = await r2Res.text();
                }
            } catch (err) {
                console.error('Failed to fetch text from R2 in CLI get:', err);
            }
        }

        // If raw text requested and clip is text
        if (isRaw && data.type === 'text') {
            return new Response(resolvedText, {
                status: 200,
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'X-Pasteport-Code': code,
                },
            });
        }

        return NextResponse.json({
            success: true,
            code: data.code,
            type: data.type,
            content: data.type === 'text' ? resolvedText : undefined,
            files: data.files || undefined,
            createdAt: data.createdAt ? new Date(data.createdAt.toMillis()).toISOString() : undefined,
            expiresAt: data.expiresAt ? new Date(data.expiresAt.toMillis()).toISOString() : undefined,
            views: (data.views || 0) + 1,
            hasDeletePin: Boolean(data.deletePin),
        });
    } catch (error) {
        console.error('CLI get endpoint error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
