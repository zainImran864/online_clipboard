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
    files?: Array<{
        url: string;
        fileName: string;
        fileType: string;
        fileSize: number;
    }>;
    // Legacy fields for backward compatibility
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
        async (
            content: string,
            type: 'text' | 'file' | 'both',
            files?: Array<{ url: string; fileName: string; fileType: string; fileSize: number }>,
            textContent?: string
        ) => {
            setLoading(true);
            setError(null);

            try {
                const code = await generateUniqueCode();
                const createdAt = Timestamp.now();
                const expiresAt = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)); // 24 hours

                const clipData: any = {
                    code,
                    type,
                    content,
                    createdAt,
                    expiresAt,
                };

                if (textContent) {
                    clipData.textContent = textContent;
                }

                if (files && files.length > 0) {
                    clipData.files = files;
                    // Keep legacy fields for backward compatibility (first file)
                    clipData.fileName = files[0].fileName;
                    clipData.fileType = files[0].fileType;
                }

                const docRef = await addDoc(collection(db, 'clips'), clipData);

                setLoading(false);
                return {
                    id: docRef.id,
                    code,
                    type,
                    content,
                    textContent,
                    files,
                    fileName: files?.[0]?.fileName,
                    fileType: files?.[0]?.fileType,
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

            // Get current clip to check type
            const clipSnap = await getDoc(clipRef);
            if (clipSnap.exists()) {
                const clipData = clipSnap.data();

                if (clipData.type === 'both') {
                    // Update textContent field for 'both' type
                    await updateDoc(clipRef, { textContent: content });
                } else if (clipData.type === 'text') {
                    // Update content field for 'text' type
                    await updateDoc(clipRef, { content });
                } else if (clipData.type === 'file') {
                    // Convert 'file' to 'both' when text is added
                    if (content.trim().length > 0) {
                        await updateDoc(clipRef, {
                            type: 'both',
                            textContent: content,
                        });
                    }
                }
            }

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
                files: data.files || (data.fileName ? [{
                    url: data.content,
                    fileName: data.fileName,
                    fileType: data.fileType,
                    fileSize: 0
                }] : undefined),
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
                    files: data.files || (data.fileName ? [{
                        url: data.content,
                        fileName: data.fileName,
                        fileType: data.fileType,
                        fileSize: 0
                    }] : undefined),
                    fileName: data.fileName,
                    fileType: data.fileType,
                    createdAt: data.createdAt.toDate(),
                    expiresAt: data.expiresAt?.toDate(),
                } as Clip);
            }
        });

        return unsubscribe;
    }, []);

    /**
     * Update a clip with file information (supports multiple files)
     */
    const updateClipWithFile = useCallback(
        async (
            clipId: string,
            newFiles: Array<{ url: string; fileName: string; fileType: string; fileSize: number }>,
            currentTextContent?: string
        ) => {
            setLoading(true);
            setError(null);

            try {
                const clipRef = doc(db, 'clips', clipId);

                // Get current clip to check type
                const clipSnap = await getDoc(clipRef);
                if (clipSnap.exists()) {
                    const clipData = clipSnap.data();

                    // Determine new type based on current state
                    const hasText = currentTextContent && currentTextContent.trim().length > 0;

                    // Merge with existing files
                    const existingFiles = clipData.files || [];
                    const allFiles = [...existingFiles, ...newFiles];

                    if (clipData.type === 'text' && hasText) {
                        // Convert text-only to both
                        await updateDoc(clipRef, {
                            type: 'both',
                            content: allFiles[0].url, // Keep first file URL in content for backward compatibility
                            textContent: currentTextContent,
                            files: allFiles,
                            fileName: allFiles[0].fileName,
                            fileType: allFiles[0].fileType,
                        });
                    } else if (clipData.type === 'file' || clipData.type === 'both') {
                        // Update existing files or add more
                        await updateDoc(clipRef, {
                            content: allFiles[0].url,
                            files: allFiles,
                            fileName: allFiles[0].fileName,
                            fileType: allFiles[0].fileType,
                        });
                    } else {
                        // Text-only with no text content, convert to file-only
                        await updateDoc(clipRef, {
                            type: 'file',
                            content: allFiles[0].url,
                            files: allFiles,
                            fileName: allFiles[0].fileName,
                            fileType: allFiles[0].fileType,
                        });
                    }
                }

                setLoading(false);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to update clip with file';
                setError(errorMessage);
                setLoading(false);
                throw err;
            }
        },
        []
    );

    return {
        loading,
        error,
        createClip,
        updateClip,
        updateClipWithFile,
        fetchClipByCode,
        subscribeToClip,
    };
}
