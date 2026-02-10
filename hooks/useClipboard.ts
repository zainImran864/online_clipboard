import { useState, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
    collection,
    addDoc,
    doc,
    getDoc,
    updateDoc,
    query,
    where,
    getDocs,
    onSnapshot,
    Timestamp,
} from 'firebase/firestore';
import { generateUniqueCode } from '@/lib/codeGenerator';
import { uploadFile, FileUploadResult } from '@/lib/fileHandler';

export interface Clip {
    id: string;
    code: string;
    type: 'text' | 'file' | 'both';
    content: string;
    textContent?: string;
    fileName?: string;
    fileType?: string;
    createdAt: Date;
    expiresAt?: Date;
}

export function useClipboard() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Create a new clip
     */
    const createClip = useCallback(
        async (content: string, type: 'text' | 'file' | 'both', fileMetadata?: Partial<FileUploadResult>, textContent?: string) => {
            setLoading(true);
            setError(null);

            try {
                const code = await generateUniqueCode();
                const createdAt = Timestamp.now();
                const expiresAt = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)); // 24 hours

                const clipData = {
                    code,
                    type,
                    content,
                    ...(textContent && { textContent }),
                    ...(fileMetadata && {
                        fileName: fileMetadata.fileName,
                        fileType: fileMetadata.fileType,
                    }),
                    createdAt,
                    expiresAt,
                };

                const docRef = await addDoc(collection(db, 'clips'), clipData);

                setLoading(false);
                return {
                    id: docRef.id,
                    code,
                    type,
                    content,
                    textContent,
                    fileName: fileMetadata?.fileName,
                    fileType: fileMetadata?.fileType,
                    createdAt: createdAt.toDate(),
                    expiresAt: expiresAt.toDate(),
                } as Clip;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to create clip';
                setError(errorMessage);
                setLoading(false);
                throw err;
            }
        },
        []
    );

    /**
     * Update an existing clip
     */
    const updateClip = useCallback(async (clipId: string, content: string) => {
        setLoading(true);
        setError(null);

        try {
            const clipRef = doc(db, 'clips', clipId);
            await updateDoc(clipRef, { content });
            setLoading(false);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update clip';
            setError(errorMessage);
            setLoading(false);
            throw err;
        }
    }, []);

    /**
     * Fetch a clip by code
     */
    const fetchClipByCode = useCallback(async (code: string): Promise<Clip | null> => {
        setLoading(true);
        setError(null);

        try {
            const clipsRef = collection(db, 'clips');
            const q = query(clipsRef, where('code', '==', code));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setLoading(false);
                return null;
            }

            const docData = querySnapshot.docs[0];
            const data = docData.data();

            setLoading(false);
            return {
                id: docData.id,
                code: data.code,
                type: data.type,
                content: data.content,
                textContent: data.textContent,
                fileName: data.fileName,
                fileType: data.fileType,
                createdAt: data.createdAt.toDate(),
                expiresAt: data.expiresAt?.toDate(),
            } as Clip;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch clip';
            setError(errorMessage);
            setLoading(false);
            throw err;
        }
    }, []);

    /**
     * Subscribe to real-time updates for a clip
     */
    const subscribeToClip = useCallback((clipId: string, callback: (clip: Clip) => void) => {
        const clipRef = doc(db, 'clips', clipId);

        const unsubscribe = onSnapshot(clipRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                callback({
                    id: docSnap.id,
                    code: data.code,
                    type: data.type,
                    content: data.content,
                    textContent: data.textContent,
                    fileName: data.fileName,
                    fileType: data.fileType,
                    createdAt: data.createdAt.toDate(),
                    expiresAt: data.expiresAt?.toDate(),
                } as Clip);
            }
        });

        return unsubscribe;
    }, []);

    return {
        loading,
        error,
        createClip,
        updateClip,
        fetchClipByCode,
        subscribeToClip,
    };
}
