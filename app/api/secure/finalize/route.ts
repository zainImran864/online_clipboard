import { NextResponse } from 'next/server';
import {
    addDoc,
    collection,
    doc,
    getDocs,
    query,
    runTransaction,
    serverTimestamp,
    Timestamp,
    where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { deleteFromR2, getR2ObjectSize } from '@/lib/r2Storage';
import { generateUnique8DigitCode } from '@/lib/codeGenerator';
import { ACCESS_CODE_LENGTH, SECURE_EXPIRATION_MS, SECURE_MAX_FILE_SIZE } from '@/lib/secureShare';

export const runtime = 'nodejs';

function isValidAccessCode(code: unknown): code is string {
    return typeof code === 'string' && new RegExp(`^\\d{${ACCESS_CODE_LENGTH}}$`).test(code);
}

/**
 * Step 2 of the secret-share upload. Confirms the file actually landed in R2,
 * atomically burns the one-time access code, and creates the `secureClips`
 * record (6h expiry) with a freshly generated send code that the uploader
 * shares with the recipient.
 */
export async function POST(request: Request) {
    try {
        const { accessCode, storageKey, fileName, fileType } = await request.json();

        if (!isValidAccessCode(accessCode)) {
            return NextResponse.json({ error: 'Invalid secret code' }, { status: 400 });
        }

        if (typeof storageKey !== 'string' || !storageKey.startsWith('secure/')) {
            return NextResponse.json({ error: 'Invalid upload reference' }, { status: 400 });
        }

        // Confirm the direct-to-R2 upload succeeded and re-check the true size.
        const actualSize = await getR2ObjectSize(storageKey);
        if (actualSize === null) {
            return NextResponse.json({ error: 'Upload not found. Please try again.' }, { status: 400 });
        }

        if (actualSize > SECURE_MAX_FILE_SIZE) {
            await deleteFromR2(storageKey).catch(() => {});
            return NextResponse.json({ error: 'File size must be 600MB or less' }, { status: 400 });
        }

        // Locate the access-code document.
        const snapshot = await getDocs(
            query(collection(db, 'accessCodes'), where('code', '==', accessCode))
        );

        if (snapshot.empty) {
            await deleteFromR2(storageKey).catch(() => {});
            return NextResponse.json({ error: 'Invalid secret code' }, { status: 403 });
        }

        const codeRef = doc(db, 'accessCodes', snapshot.docs[0].id);

        // Atomically burn the one-time code; a concurrent finalize loses here.
        try {
            await runTransaction(db, async (transaction) => {
                const codeSnap = await transaction.get(codeRef);
                if (!codeSnap.exists()) {
                    throw new Error('Invalid secret code');
                }
                if (codeSnap.data().used === true) {
                    throw new Error('This secret code has already been used');
                }
                transaction.update(codeRef, { used: true, usedAt: serverTimestamp() });
            });
        } catch (txError) {
            await deleteFromR2(storageKey).catch(() => {});
            const message = txError instanceof Error ? txError.message : 'This secret code has already been used';
            return NextResponse.json({ error: message }, { status: 403 });
        }

        const sendCode = await generateUnique8DigitCode('secureClips', 'sendCode');
        const expiresAt = Timestamp.fromDate(new Date(Date.now() + SECURE_EXPIRATION_MS));

        await addDoc(collection(db, 'secureClips'), {
            sendCode,
            storageKey,
            fileName: typeof fileName === 'string' ? fileName : 'file',
            fileType: typeof fileType === 'string' && fileType ? fileType : 'application/octet-stream',
            fileSize: actualSize,
            accessCode,
            createdAt: serverTimestamp(),
            expiresAt,
        });

        return NextResponse.json({ sendCode });
    } catch (error) {
        console.error('Secure finalize failed:', error);
        const message = error instanceof Error ? error.message : 'Failed to finalize upload';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
