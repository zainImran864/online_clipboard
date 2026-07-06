import { NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createPresignedUploadUrl, createSecureStorageKey } from '@/lib/r2Storage';
import { ACCESS_CODE_LENGTH, SECURE_MAX_FILE_SIZE } from '@/lib/secureShare';

export const runtime = 'nodejs';

function isValidAccessCode(code: unknown): code is string {
    return typeof code === 'string' && new RegExp(`^\\d{${ACCESS_CODE_LENGTH}}$`).test(code);
}

/**
 * Step 1 of the secret-share upload. Validates the one-time access code and,
 * if it is valid and unused, returns a presigned POST so the browser can upload
 * the file directly to R2 (the file never passes through this server).
 *
 * The code is not consumed here — it is burned in /finalize once the upload has
 * actually landed, so a failed upload doesn't waste the code.
 */
export async function POST(request: Request) {
    try {
        const { accessCode, fileName, fileType, fileSize } = await request.json();

        if (!isValidAccessCode(accessCode)) {
            return NextResponse.json({ error: 'Invalid secret code' }, { status: 400 });
        }

        if (typeof fileName !== 'string' || !fileName.trim()) {
            return NextResponse.json({ error: 'A file name is required' }, { status: 400 });
        }

        if (typeof fileSize !== 'number' || !Number.isFinite(fileSize) || fileSize <= 0) {
            return NextResponse.json({ error: 'A valid file size is required' }, { status: 400 });
        }

        if (fileSize > SECURE_MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File size must be 600MB or less' }, { status: 400 });
        }

        const snapshot = await getDocs(
            query(collection(db, 'accessCodes'), where('code', '==', accessCode))
        );

        if (snapshot.empty) {
            return NextResponse.json({ error: 'Invalid secret code' }, { status: 403 });
        }

        const codeDoc = snapshot.docs[0];
        if (codeDoc.data().used === true) {
            return NextResponse.json(
                { error: 'This secret code has already been used' },
                { status: 403 }
            );
        }

        const contentType = typeof fileType === 'string' && fileType ? fileType : 'application/octet-stream';
        const storageKey = createSecureStorageKey(fileName);

        const uploadUrl = await createPresignedUploadUrl({ storageKey });

        return NextResponse.json({ storageKey, uploadUrl, contentType });
    } catch (error) {
        console.error('Secure authorize failed:', error);
        const message = error instanceof Error ? error.message : 'Failed to authorize upload';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
