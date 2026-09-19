import { NextResponse } from 'next/server';
import { collection, getDocs, query, where, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code, accessPin, enabled, creatorToken } = body;

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

        // Enforce creatorToken verification if set on clip
        if (data.creatorToken && data.creatorToken !== creatorToken) {
            return NextResponse.json({ error: 'Unauthorized to update this clip' }, { status: 403 });
        }

        if (enabled) {
            if (!accessPin || typeof accessPin !== 'string' || accessPin.trim().length !== 4) {
                return NextResponse.json({ error: 'Access PIN must be exactly 4 characters' }, { status: 400 });
            }

            const normalizedPin = accessPin.trim().toLowerCase();
            await updateDoc(clipDoc.ref, {
                accessPin: normalizedPin,
                hasAccessPin: true,
            });

            return NextResponse.json({
                success: true,
                message: 'Access PIN enabled and updated successfully',
                hasAccessPin: true,
            });
        } else {
            // Disable access PIN
            await updateDoc(clipDoc.ref, {
                accessPin: deleteField(),
                hasAccessPin: false,
            });

            return NextResponse.json({
                success: true,
                message: 'Access PIN disabled successfully',
                hasAccessPin: false,
            });
        }
    } catch (error) {
        console.error('Error updating access PIN:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
