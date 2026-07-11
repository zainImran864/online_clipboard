import { useState, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
    collection,
    addDoc,
    doc,
    getDoc,
    updateDoc,
    deleteField,
    query,
    where,
    getDocs,
    onSnapshot,
    Timestamp,
} from 'firebase/firestore';
import { generateUniqueCode } from '@/lib/codeGenerator';

export type StorageProvider = 'firebase-inline' | 'r2';

// Text larger than this (UTF-8 bytes) is offloaded to R2 instead of being
// written inline, since a Firestore document is capped at ~1 MiB total.
const TEXT_INLINE_LIMIT = 900 * 1024;

function getTextByteSize(text: string) {
    return new TextEncoder().encode(text).length;
}

/**
 * Maps a raw error to a user-safe message. Firestore rejects any document
 * write over ~1 MiB and embeds the full database path (project id, collection,
 * doc id) in its message — that must never reach the UI. Known-safe messages
 * are passed through; anything that looks like a Firestore internal error is
 * replaced with the given fallback.
 */
function getSafeClipError(err: unknown, fallback: string): string {
    const raw = err instanceof Error ? err.message : '';

    if (/maximum allowed size/i.test(raw) || /exceeds the maximum/i.test(raw)) {
        return 'This file is too large to share. Please try a smaller file.';
    }

    // Drop anything that leaks an internal database path or Firebase error code.
    if (/databases\/\(default\)|projects\/[^/]+\/databases|FirebaseError|\[code=/i.test(raw)) {
        return fallback;
    }

    return raw || fallback;
}

async function uploadTextToR2(text: string): Promise<{ url: string; storageKey: string }> {
    const response = await fetch('/api/text/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Failed to store large text');
    }

    return result;
}

/**
 * Builds the Firestore field payload for a text value, offloading to R2 when
 * it exceeds the inline limit. `fieldName` is the field that holds the text
 * ('content' for text-only clips, 'textContent' for 'both' clips).
 */
async function buildTextFields(text: string, fieldName: 'content' | 'textContent') {
    if (getTextByteSize(text) > TEXT_INLINE_LIMIT) {
        const uploaded = await uploadTextToR2(text);
        return {
            [fieldName]: uploaded.url,
            textStorageProvider: 'r2' as const,
            textStorageKey: uploaded.storageKey,
        };
    }

    return {
        [fieldName]: text,
        // Clear any previous R2 markers when the text shrinks back to inline.
        textStorageProvider: deleteField(),
        textStorageKey: deleteField(),
    };
}

/**
 * Resolves the actual text of a clip, fetching it from R2 when it was offloaded.
 * Keeps `content` / `textContent` as plain strings for the rest of the app.
 */
async function resolveTextFromStorage(data: any): Promise<{ content: string; textContent?: string }> {
    let content = data.content;
    let textContent = data.textContent;

    if (data.textStorageProvider === 'r2') {
        try {
            if (data.type === 'text') {
                content = await (await fetch(data.content)).text();
            } else if (data.textContent) {
                textContent = await (await fetch(data.textContent)).text();
            }
        } catch (err) {
            console.error('Failed to load large text from storage:', err);
        }
    }

    return { content, textContent };
}

export interface SharedFile {
    url: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    storageProvider?: StorageProvider;
    storageKey?: string;
}

export interface Clip {
    id: string;
    code: string;
    type: 'text' | 'file' | 'both';
    content: string;
    textContent?: string;
    files?: SharedFile[];
    // Present when the clip's text is stored in R2 rather than inline.
    textStorageProvider?: StorageProvider;
    textStorageKey?: string;
    // Legacy fields for backward compatibility
    fileName?: string;
    fileType?: string;
    createdAt: Date;
    expiresAt?: Date;
}

export function useClipboard() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const EXPIRATION_MS = 24 * 60 * 60 * 1000;

    /**
     * Create a new clip
     */
    const createClip = useCallback(
        async (
            content: string,
            type: 'text' | 'file' | 'both',
            files?: SharedFile[],
            textContent?: string
        ) => {
            setLoading(true);
            setError(null);

            try {
                const code = await generateUniqueCode();
                const createdAt = Timestamp.now();
                // Keep this field for Firestore TTL (configure TTL on `expiresAt`).
                const expiresAt = Timestamp.fromDate(new Date(Date.now() + EXPIRATION_MS));

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

                // Offload oversized text to R2. For text-only clips the text
                // lives in `content`; for 'both' clips it lives in `textContent`.
                const inlineTextField = type === 'text' ? 'content' : textContent ? 'textContent' : null;
                if (inlineTextField) {
                    const textValue = clipData[inlineTextField];
                    if (getTextByteSize(textValue) > TEXT_INLINE_LIMIT) {
                        const uploaded = await uploadTextToR2(textValue);
                        clipData[inlineTextField] = uploaded.url;
                        clipData.textStorageProvider = 'r2';
                        clipData.textStorageKey = uploaded.storageKey;
                    }
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
                const errorMessage = getSafeClipError(err, 'Failed to create clip. Please try again.');
                setError(errorMessage);
                setLoading(false);
                throw new Error(errorMessage);
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
                    await updateDoc(clipRef, await buildTextFields(content, 'textContent'));
                } else if (clipData.type === 'text') {
                    // Update content field for 'text' type
                    await updateDoc(clipRef, await buildTextFields(content, 'content'));
                } else if (clipData.type === 'file') {
                    // Convert 'file' to 'both' when text is added
                    if (content.trim().length > 0) {
                        await updateDoc(clipRef, {
                            type: 'both',
                            ...(await buildTextFields(content, 'textContent')),
                        });
                    }
                }
            }

            setLoading(false);
        } catch (err) {
            const errorMessage = getSafeClipError(err, 'Failed to update clip. Please try again.');
            setError(errorMessage);
            setLoading(false);
            throw new Error(errorMessage);
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

            if (data.expiresAt && data.expiresAt.toMillis() <= Date.now()) {
                // Treat as gone, but leave deletion to the cron so it can also
                // remove any associated R2 objects (text/files) — the browser
                // cannot delete from R2 and would orphan them.
                setLoading(false);
                return null;
            }

            const { content, textContent } = await resolveTextFromStorage(data);

            setLoading(false);
            return {
                id: docData.id,
                code: data.code,
                type: data.type,
                content,
                textContent,
                textStorageProvider: data.textStorageProvider,
                textStorageKey: data.textStorageKey,
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
            const errorMessage = getSafeClipError(err, 'Failed to fetch clip. Please try again.');
            setError(errorMessage);
            setLoading(false);
            throw new Error(errorMessage);
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
                if (data.expiresAt && data.expiresAt.toMillis() <= Date.now()) {
                    // Leave deletion to the cron so R2 objects are cleaned too.
                    return;
                }
                void (async () => {
                    const { content, textContent } = await resolveTextFromStorage(data);
                    callback({
                        id: docSnap.id,
                        code: data.code,
                        type: data.type,
                        content,
                        textContent,
                        textStorageProvider: data.textStorageProvider,
                        textStorageKey: data.textStorageKey,
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
                })();
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
            newFiles: SharedFile[],
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
                            ...(await buildTextFields(currentTextContent as string, 'textContent')),
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
                const errorMessage = getSafeClipError(err, 'Failed to attach file. Please try again.');
                setError(errorMessage);
                setLoading(false);
                throw new Error(errorMessage);
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

