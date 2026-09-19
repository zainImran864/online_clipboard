import { NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code, pin } = body;

        if (!code || typeof code !== 'string') {
            return NextResponse.json({ error: 'Valid clip code is required' }, { status: 400 });
        }

        const clipsRef = collection(db, 'clips');
        const q = query(clipsRef, where('code', '==', code.trim()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
        }

        const clipDoc = querySnapshot.docs[0];
        const data = clipDoc.data();

        // Check if expired
        if (data.expiresAt && data.expiresAt.toMillis() <= Date.now()) {
            return NextResponse.json({ error: 'Clip has expired' }, { status: 410 });
        }

        // If no access PIN configured, access is free
        if (!data.accessPin) {
            return NextResponse.json({ valid: true });
        }

        if (!pin || typeof pin !== 'string') {
            return NextResponse.json({ valid: false, error: 'PIN is required' }, { status: 400 });
        }

        const normalizedEntered = String(pin).trim().toLowerCase();
        const normalizedStored = String(data.accessPin).trim().toLowerCase();

        if (normalizedEntered === normalizedStored) {
            return NextResponse.json({ valid: true });
        }

        return NextResponse.json(
            { valid: false, error: 'Incorrect 4-character PIN. Please try again.' },
            { status: 401 }
        );
    } catch (error) {
        console.error('Error verifying access PIN:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
