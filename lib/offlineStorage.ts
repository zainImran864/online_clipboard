// Client-side offline storage for Pasteport clips using IndexedDB
// Enables mobile and desktop users to view clips and download files even with zero internet connectivity.

export interface OfflineFile {
    fileName: string;
    fileType: string;
    fileSize: number;
    dataUrl: string; // Base64 Data URI or Blob URL
}

export interface OfflineClip {
    id?: string;
    code: string;
    type: 'text' | 'file' | 'both';
    content?: string;
    textContent?: string;
    files?: OfflineFile[];
    savedAt: number;
    expiresAt?: number;
    hasAccessPin?: boolean;
}

const DB_NAME = 'pasteport_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'saved_clips';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
            reject(new Error('IndexedDB is not supported in this environment'));
            return;
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'code' });
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error || new Error('Failed to open offline database'));
        };
    });
}

/**
 * Fetch a file URL and convert it to a local base64 data URL for offline storage.
 */
async function fetchFileAsDataUrl(url: string): Promise<string> {
    if (url.startsWith('data:')) {
        return url;
    }
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to convert blob to data URL'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Save a clip and all its files into offline storage.
 */
export async function saveClipOffline(clip: {
    code: string;
    type: 'text' | 'file' | 'both';
    content?: string;
    textContent?: string;
    files?: Array<{
        url: string;
        fileName: string;
        fileType: string;
        fileSize?: number;
    }>;
    expiresAt?: Date | null;
    hasAccessPin?: boolean;
}): Promise<void> {
    const offlineFiles: OfflineFile[] = [];

    // Cache all attached files locally
    if (clip.files && clip.files.length > 0) {
        for (const file of clip.files) {
            try {
                const dataUrl = await fetchFileAsDataUrl(file.url);
                offlineFiles.push({
                    fileName: file.fileName,
                    fileType: file.fileType,
                    fileSize: file.fileSize || 0,
                    dataUrl,
                });
            } catch (err) {
                console.warn(`[OfflineStorage] Failed to cache file ${file.fileName}:`, err);
                // Still include metadata even if file caching fails
                offlineFiles.push({
                    fileName: file.fileName,
                    fileType: file.fileType,
                    fileSize: file.fileSize || 0,
                    dataUrl: file.url,
                });
            }
        }
    }

    // Cache oversized text if it's hosted on R2
    let cachedContent = clip.content || '';
    if (clip.content && clip.content.startsWith('http')) {
        try {
            const res = await fetch(clip.content);
            cachedContent = await res.text();
        } catch (err) {
            console.warn('[OfflineStorage] Failed to fetch oversized text:', err);
        }
    }

    let cachedTextContent = clip.textContent;
    if (clip.textContent && clip.textContent.startsWith('http')) {
        try {
            const res = await fetch(clip.textContent);
            cachedTextContent = await res.text();
        } catch (err) {
            console.warn('[OfflineStorage] Failed to fetch oversized textContent:', err);
        }
    }

    const offlineRecord: OfflineClip = {
        code: clip.code,
        type: clip.type,
        content: cachedContent,
        textContent: cachedTextContent,
        files: offlineFiles,
        savedAt: Date.now(),
        expiresAt: clip.expiresAt ? clip.expiresAt.getTime() : undefined,
        hasAccessPin: clip.hasAccessPin,
    };

    try {
        const db = await openDB();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.put(offlineRecord);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.warn('[OfflineStorage] IndexedDB save failed, falling back to localStorage:', err);
        if (typeof window !== 'undefined') {
            try {
                // Remove large base64 data for localStorage fallback if necessary
                const liteRecord = { ...offlineRecord, files: offlineRecord.files?.map(f => ({ ...f, dataUrl: '' })) };
                localStorage.setItem(`offline_clip_${clip.code}`, JSON.stringify(liteRecord));
            } catch {
                // Storage full or quota exceeded
            }
        }
    }
}

/**
 * Retrieve an offline clip by its 6-digit code.
 */
export async function getOfflineClip(code: string): Promise<OfflineClip | null> {
    try {
        const db = await openDB();
        const record = await new Promise<OfflineClip | null>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(code);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });

        if (record) return record;
    } catch (err) {
        console.warn('[OfflineStorage] IndexedDB read failed, checking localStorage fallback:', err);
    }

    // Check localStorage fallback
    if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(`offline_clip_${code}`);
        if (raw) {
            try {
                return JSON.parse(raw);
            } catch {
                return null;
            }
        }
    }

    return null;
}

/**
 * List all clips saved for offline viewing on this device.
 */
export async function getAllOfflineClips(): Promise<OfflineClip[]> {
    try {
        const db = await openDB();
        return await new Promise<OfflineClip[]>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch {
        // Fallback from localStorage
        const clips: OfflineClip[] = [];
        if (typeof window !== 'undefined') {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('offline_clip_')) {
                    try {
                        const parsed = JSON.parse(localStorage.getItem(key) || '');
                        clips.push(parsed);
                    } catch {
                        // Ignore corrupted records
                    }
                }
            }
        }
        return clips;
    }
}

/**
 * Check if a specific clip code is already saved offline.
 */
export async function isClipSavedOffline(code: string): Promise<boolean> {
    const clip = await getOfflineClip(code);
    return clip !== null;
}

/**
 * Delete an offline clip by code.
 */
export async function deleteOfflineClip(code: string): Promise<void> {
    try {
        const db = await openDB();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.delete(code);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch {
        // Ignore
    }

    if (typeof window !== 'undefined') {
        localStorage.removeItem(`offline_clip_${code}`);
    }
}
