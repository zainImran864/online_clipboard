import { NextResponse } from 'next/server';
import {
    collection,
    deleteDoc,
    getDocs,
    query,
    where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { deleteFromR2 } from '@/lib/r2Storage';

export const runtime = 'nodejs';

type StoredFile = {
    storageProvider?: string;
    storageKey?: string;
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code, pin, creatorToken } = body;

        if (!code || typeof code !== 'string') {
            return NextResponse.json({ error: 'Valid clip code is required' }, { status: 400 });
        }

        const clipsRef = collection(db, 'clips');
        const q = query(clipsRef, where('code', '==', code.trim()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return NextResponse.json({ error: 'Clip not found or already deleted' }, { status: 404 });
        }

        const clipDoc = querySnapshot.docs[0];
        const data = clipDoc.data();

        // Check authentication / authorization
        // Check if clip is expired - expired clips are purged immediately
        const isExpired = Boolean(data.expiresAt && data.expiresAt.toMillis() <= Date.now());
        const hasPin = Boolean(data.deletePin);
        const isCreator = Boolean(data.creatorToken && creatorToken && data.creatorToken === creatorToken);

        let isAuthorized = false;

        if (isExpired) {
            isAuthorized = true;
        } else if (hasPin) {
            if (pin && String(pin).trim() === String(data.deletePin).trim()) {
                isAuthorized = true;
            } else if (isCreator) {
                isAuthorized = true;
            } else {
                return NextResponse.json(
                    { error: 'Incorrect Self-Destruct PIN' },
                    { status: 401 }
                );
            }
        } else {
            // No PIN was configured on the clip
            isAuthorized = true;
        }

        if (!isAuthorized) {
            return NextResponse.json(
                { error: 'Unauthorized to revoke this clip' },
                { status: 401 }
            );
        }

        // Delete all R2 objects associated with this clip
        const files = Array.isArray(data.files) ? (data.files as StoredFile[]) : [];
        const r2Keys: string[] = files
            .filter((file) => file.storageProvider === 'r2' && file.storageKey)
            .map((file) => file.storageKey as string);

        if (data.textStorageProvider === 'r2' && data.textStorageKey) {
            r2Keys.push(data.textStorageKey as string);
        }

        for (const storageKey of r2Keys) {
            try {
                await deleteFromR2(storageKey);
            } catch (err) {
                console.error('Error deleting R2 object on manual destruction:', storageKey, err);
            }
        }

        // Delete Firestore document
        await deleteDoc(clipDoc.ref);

        return NextResponse.json({
            success: true,
            message: 'Clip and all associated data have been permanently destroyed',
        });
    } catch (error) {
        console.error('Failed to revoke clip:', error);
        return NextResponse.json(
            { error: 'An error occurred while destroying the clip' },
            { status: 500 }
        );
    }
}
