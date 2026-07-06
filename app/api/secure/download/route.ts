import { NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createPresignedDownloadUrl } from '@/lib/r2Storage';
import { SEND_CODE_LENGTH } from '@/lib/secureShare';

export const runtime = 'nodejs';

function isValidSendCode(code: unknown): code is string {
    return typeof code === 'string' && new RegExp(`^\\d{${SEND_CODE_LENGTH}}$`).test(code);
}

/**
 * Resolves a send code to a short-lived download URL. Single request — there is
 * deliberately no realtime/live path for secret shares. Refuses anything past
 * its 6h expiry immediately, even before the cron sweep removes it.
 */
export async function POST(request: Request) {
    try {
        const { sendCode } = await request.json();

        if (!isValidSendCode(sendCode)) {
            return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
        }

        const snapshot = await getDocs(
            query(collection(db, 'secureClips'), where('sendCode', '==', sendCode))
        );

        if (snapshot.empty) {
            return NextResponse.json({ error: 'Code not found or expired' }, { status: 404 });
        }

        const data = snapshot.docs[0].data();

        if (data.expiresAt && data.expiresAt.toMillis() <= Date.now()) {
            // Leave the actual deletion to the cron so the R2 object is cleaned too.
            return NextResponse.json({ error: 'This file has expired' }, { status: 410 });
        }

        const url = await createPresignedDownloadUrl(data.storageKey, data.fileName);

        return NextResponse.json({
            url,
            fileName: data.fileName,
            fileType: data.fileType,
            fileSize: data.fileSize,
            expiresAt: data.expiresAt?.toDate().toISOString() ?? null,
        });
    } catch (error) {
        console.error('Secure download failed:', error);
        const message = error instanceof Error ? error.message : 'Failed to fetch file';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
