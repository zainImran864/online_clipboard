import { NextResponse } from 'next/server';
import {
    collection,
    deleteDoc,
    getDocs,
    limit,
    query,
    Timestamp,
    where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { deleteFromR2 } from '@/lib/r2Storage';

export const runtime = 'nodejs';

type StoredFile = {
    storageProvider?: string;
    storageKey?: string;
};

const BATCH_SIZE = 100;

function isAuthorized(request: Request) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) return false;

    return request.headers.get('authorization') === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let deletedClips = 0;
    let deletedR2Objects = 0;
    let r2DeleteErrors = 0;
    let checkedClips = 0;

    while (true) {
        const expiredClips = await getDocs(
            query(collection(db, 'clips'), where('expiresAt', '<=', Timestamp.now()), limit(BATCH_SIZE))
        );

        if (expiredClips.empty) break;

        checkedClips += expiredClips.size;
        const deletedBeforeBatch = deletedClips;

        for (const clipDoc of expiredClips.docs) {
            const data = clipDoc.data();
            const files = Array.isArray(data.files) ? (data.files as StoredFile[]) : [];
            const r2Keys = files
                .filter((file) => file.storageProvider === 'r2' && file.storageKey)
                .map((file) => file.storageKey as string);

            // Oversized text is stored in R2 too — clean it up alongside files.
            if (data.textStorageProvider === 'r2' && data.textStorageKey) {
                r2Keys.push(data.textStorageKey as string);
            }

            let clipHadDeleteError = false;

            for (const storageKey of r2Keys) {
                try {
                    await deleteFromR2(storageKey);
                    deletedR2Objects += 1;
                } catch (error) {
                    console.error(`Failed to delete R2 object ${storageKey}:`, error);
                    r2DeleteErrors += 1;
                    clipHadDeleteError = true;
                }
            }

            if (!clipHadDeleteError) {
                await deleteDoc(clipDoc.ref);
                deletedClips += 1;
            }
        }

        if (deletedClips === deletedBeforeBatch) break;
    }

    // Secret-share uploads live in their own collection with a single R2 object
    // each (storageKey) and a 6h expiry. Sweep them the same way.
    let deletedSecureClips = 0;
    let checkedSecureClips = 0;

    while (true) {
        const expiredSecure = await getDocs(
            query(collection(db, 'secureClips'), where('expiresAt', '<=', Timestamp.now()), limit(BATCH_SIZE))
        );

        if (expiredSecure.empty) break;

        checkedSecureClips += expiredSecure.size;
        const deletedBeforeBatch = deletedSecureClips;

        for (const secureDoc of expiredSecure.docs) {
            const storageKey = secureDoc.data().storageKey as string | undefined;
            let hadDeleteError = false;

            if (storageKey) {
                try {
                    await deleteFromR2(storageKey);
                    deletedR2Objects += 1;
                } catch (error) {
                    console.error(`Failed to delete R2 object ${storageKey}:`, error);
                    r2DeleteErrors += 1;
                    hadDeleteError = true;
                }
            }

            if (!hadDeleteError) {
                await deleteDoc(secureDoc.ref);
                deletedSecureClips += 1;
            }
        }

        if (deletedSecureClips === deletedBeforeBatch) break;
    }

    return NextResponse.json({
        checked: checkedClips,
        deletedClips,
        checkedSecureClips,
        deletedSecureClips,
        deletedR2Objects,
        r2DeleteErrors,
    });
}

