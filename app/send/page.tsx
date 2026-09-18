'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import Footer from '@/components/Footer';
import FileUpload from '@/components/FileUpload';
import ShareCodeCard from '@/components/ShareCodeCard';
import { useClipboard, Clip } from '@/hooks/useClipboard';
import { uploadFile, validateFile, FileUploadResult } from '@/lib/fileHandler';
import { showToast, startNavigation } from '@/lib/appEvents';

interface UploadProgressLineProps {
    progress?: number;
}

function UploadProgressLine({ progress }: UploadProgressLineProps) {
    if (typeof progress !== 'number') return null;

    return (
        <div className="mt-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-blue-700">
                <span>{progress >= 100 ? 'Uploaded' : 'Uploading'}</span>
                <span>{progress}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-blue-100">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-[width] duration-200"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

interface GenerateProgressPanelProps {
    progress: number;
    label: string;
}

function GenerateProgressPanel({ progress, label }: GenerateProgressPanelProps) {
    return (
        <div className="border-t border-slate-100 px-3 pb-4 sm:px-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-center justify-between text-xs font-bold text-blue-800">
                    <span>{label}</span>
                    <span>{progress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 transition-[width] duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

export default function SendPage() {
    const router = useRouter();
    const {
        createClip,
        updateClip,
        updateClipWithFile,
        removeFileFromClip,
        subscribeToClip,
        destroyClip,
        loading,
        error,
    } = useClipboard();

    const [textContent, setTextContent] = useState<string>('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [clip, setClip] = useState<Clip | null>(null);
    const [uploading, setUploading] = useState(false);
    const [isDestroying, setIsDestroying] = useState(false);
    const [activeTab, setActiveTab] = useState<'text' | 'files' | 'both'>('both');
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const [liveUploadingFiles, setLiveUploadingFiles] = useState<File[]>([]);
    const [generateProgress, setGenerateProgress] = useState<{ value: number; label: string } | null>(null);

    // Productivity & Security Features
    const [expirationHours, setExpirationHours] = useState<number>(24);
    const [deletePin, setDeletePin] = useState<string>('');
    const [showSecurityOptions, setShowSecurityOptions] = useState<boolean>(false);
    const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

    // Mount effect to handle developer utils prefill
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const prefill = sessionStorage.getItem('pasteport_prefill_text');
            if (prefill) {
                sessionStorage.removeItem('pasteport_prefill_text');
                setTimeout(() => {
                    setTextContent(prefill);
                    setActiveTab('both');
                    showToast('Payload imported from Developer Utilities');
                }, 0);
            }
        }
    }, []);

    // Reference max for the size meter (the per-file limit). Not a daily quota.
    const SIZE_METER_MAX_BYTES = 10 * 1024 * 1024;
    const selectedBytes = selectedFiles.reduce((sum, f) => sum + f.size, 0);
    const showText = activeTab === 'text' || activeTab === 'both';
    const showFiles = activeTab === 'files' || activeTab === 'both';

    const formatBytes = (bytes: number) => {
        if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${bytes} B`;
    };
    const getFileKey = (file: File, index: number) => `${file.name}-${file.size}-${file.lastModified}-${index}`;

    const updateUploadProgress = (key: string, progress: number) => {
        setUploadProgress((current) => ({ ...current, [key]: progress }));
    };

    // Icon shown on a selected-file pill, picked from its extension.
    const fileEmoji = (name: string) => {
        const ext = name.split('.').pop()?.toLowerCase() || '';
        if (['zip', 'rar', 'tar', 'gz', 'tgz'].includes(ext)) return '🗜️';
        if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return '🖼️';
        if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v', 'mpeg', 'mpg', '3gp', 'ogv'].includes(ext)) return '🎬';
        if (['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'opus', 'weba', 'mid', 'midi'].includes(ext)) return '🎵';
        if (ext === 'pdf') return '📕';
        if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return '📄';
        return '📎';
    };

    // Subscribe to real-time updates
    useEffect(() => {
        if (clip?.id) {
            const unsubscribe = subscribeToClip(clip.id, (updatedClip) => {
                setClip(updatedClip);
                // Update text content based on the type
                if (updatedClip.textContent !== undefined) {
                    setTextContent(updatedClip.textContent);
                } else if (updatedClip.type === 'text') {
                    setTextContent(updatedClip.content);
                }
            });

            localStorage.setItem('clipId', clip.id);

            return () => unsubscribe();
        }
    }, [clip?.id, subscribeToClip]);

    const handleTextChange = useCallback(async (newText: string) => {
        setTextContent(newText);

        // Update Firestore in real-time if clip exists
        if (clip) {
            try {
                await updateClip(clip.id, newText);
            } catch (err) {
                console.error('Error updating clip:', err);
            }
        }
    }, [clip, updateClip]);

    const handleFileUploadAfterGenerate = useCallback(async (files: File[]) => {
        if (!clip || files.length === 0) return;

        setUploading(true);
        setLiveUploadingFiles(files);
        setUploadProgress({});
        try {
            const uploadPromises = files.map((file, index) => {
                const key = getFileKey(file, index);
                return uploadFile(file, 'temp', {
                    onProgress: (progress) => updateUploadProgress(key, progress),
                });
            });
            const results = await Promise.all(uploadPromises);

            // Update the clip with new files
            await updateClipWithFile(clip.id, results, textContent);

            setLiveUploadingFiles([]);
            setUploadProgress({});
        } catch (err) {
            console.error('Error uploading files live:', err);
            const message = err instanceof Error ? err.message : 'Failed to upload files. Please try again.';
            alert(message);
        } finally {
            setUploading(false);
            setTimeout(() => {
                setLiveUploadingFiles([]);
                setUploadProgress({});
            }, 600);
        }
    }, [clip, textContent, updateClipWithFile]);

    // Global Clipboard Paste (Ctrl + V anywhere)
    useEffect(() => {
        const handleGlobalPaste = async (e: ClipboardEvent) => {
            const target = e.target as HTMLElement | null;
            const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

            // Check if files or screenshots were pasted
            const clipboardFiles = Array.from(e.clipboardData?.files || []);
            if (clipboardFiles.length > 0) {
                e.preventDefault();
                const validFiles: File[] = [];

                for (const f of clipboardFiles) {
                    const validation = validateFile(f);
                    if (validation.valid) {
                        validFiles.push(f);
                    } else {
                        showToast(validation.error || 'Invalid file type');
                    }
                }

                if (validFiles.length > 0) {
                    if (clip) {
                        await handleFileUploadAfterGenerate(validFiles);
                        showToast(`Attached & uploaded ${validFiles.length} pasted file(s)`);
                    } else {
                        setSelectedFiles((prev) => [...prev, ...validFiles]);
                        setActiveTab('both');
                        showToast(`Pasted ${validFiles.length} file(s) from clipboard`);
                    }
                }
                return;
            }

            // Check if text was pasted outside of input/textarea
            if (!isInput && e.clipboardData) {
                const pastedText = e.clipboardData.getData('text');
                if (pastedText && pastedText.trim().length > 0) {
                    e.preventDefault();
                    if (clip) {
                        const newText = textContent ? `${textContent}\n${pastedText}` : pastedText;
                        await handleTextChange(newText);
                        showToast('Pasted text synced to active share');
                    } else {
                        setTextContent((prev) => (prev ? `${prev}\n${pastedText}` : pastedText));
                        setActiveTab((prev) => (prev === 'files' ? 'both' : prev));
                        showToast('Pasted text from clipboard');
                    }
                }
            }
        };

        window.addEventListener('paste', handleGlobalPaste);
        return () => window.removeEventListener('paste', handleGlobalPaste);
    }, [clip, textContent, handleFileUploadAfterGenerate, handleTextChange]);

    // Global Drag & Drop anywhere on page
    useEffect(() => {
        let dragCounter = 0;

        const handleDragEnter = (e: DragEvent) => {
            if (e.dataTransfer?.types?.includes('Files')) {
                e.preventDefault();
                dragCounter += 1;
                setIsDraggingOver(true);
            }
        };

        const handleDragOver = (e: DragEvent) => {
            if (e.dataTransfer?.types?.includes('Files')) {
                e.preventDefault();
            }
        };

        const handleDragLeave = () => {
            dragCounter -= 1;
            if (dragCounter <= 0) {
                dragCounter = 0;
                setIsDraggingOver(false);
            }
        };

        const handleDrop = async (e: DragEvent) => {
            e.preventDefault();
            dragCounter = 0;
            setIsDraggingOver(false);

            const droppedFiles = Array.from(e.dataTransfer?.files || []);
            if (droppedFiles.length === 0) return;

            const validFiles: File[] = [];
            for (const f of droppedFiles) {
                const validation = validateFile(f);
                if (validation.valid) {
                    validFiles.push(f);
                } else {
                    showToast(validation.error || 'Invalid file type');
                }
            }

            if (validFiles.length > 0) {
                if (clip) {
                    await handleFileUploadAfterGenerate(validFiles);
                    showToast(`Uploaded ${validFiles.length} dropped file(s)`);
                } else {
                    setSelectedFiles((prev) => [...prev, ...validFiles]);
                    setActiveTab('both');
                    showToast(`Attached ${validFiles.length} dropped file(s)`);
                }
            }
        };

        window.addEventListener('dragenter', handleDragEnter);
        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragenter', handleDragEnter);
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('drop', handleDrop);
        };
    }, [clip, handleFileUploadAfterGenerate]);

    const handleGenerateCode = async () => {
        const hasText = showText && textContent.trim().length > 0;
        const hasFiles = showFiles && selectedFiles.length > 0;

        if (!hasText && !hasFiles) {
            alert('Please enter some text or select at least one file');
            return;
        }

        setUploading(true);
        setUploadProgress({});
        setGenerateProgress({ value: 8, label: 'Preparing your share...' });

        try {
            let uploadedFiles: FileUploadResult[] = [];

            // Upload all selected files
            if (hasFiles) {
                const progressValues: Record<string, number> = {};
                setGenerateProgress({ value: 18, label: 'Uploading files...' });
                const uploadPromises = selectedFiles.map((file, index) => {
                    const key = getFileKey(file, index);
                    return uploadFile(file, 'temp', {
                        onProgress: (progress) => {
                            progressValues[key] = progress;
                            updateUploadProgress(key, progress);
                            const average = Math.round(
                                selectedFiles.reduce((sum, currentFile, currentIndex) => {
                                    return sum + (progressValues[getFileKey(currentFile, currentIndex)] || 0);
                                }, 0) / selectedFiles.length
                            );
                            setGenerateProgress({
                                value: Math.min(78, 18 + Math.round(average * 0.6)),
                                label: 'Uploading files...',
                            });
                        },
                    });
                });
                const results = await Promise.all(uploadPromises);
                uploadedFiles = results;
            }

            setGenerateProgress({ value: 84, label: 'Generating share code...' });

            const creatorToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
            const clipOptions = {
                expirationHours,
                deletePin: deletePin.trim() || undefined,
                creatorToken,
            };

            // Determine type and create clip
            let newClip: Clip;
            if (hasText && hasFiles) {
                newClip = await createClip(
                    uploadedFiles[0].url,
                    'both',
                    uploadedFiles,
                    textContent,
                    clipOptions
                );
            } else if (hasFiles) {
                newClip = await createClip(uploadedFiles[0].url, 'file', uploadedFiles, undefined, clipOptions);
            } else {
                newClip = await createClip(textContent, 'text', undefined, undefined, clipOptions);
            }

            setGenerateProgress({ value: 100, label: 'Share code ready' });
            setClip(newClip);

            localStorage.setItem('creatorToken_' + newClip.code, creatorToken);
            localStorage.setItem('lastShare', JSON.stringify({
                code: newClip.code,
                url: window.location.origin + '/view/' + newClip.code,
                createdAt: new Date().toISOString(),
            }));
            setSelectedFiles([]);
            setUploadProgress({});
            showToast('Share created successfully!');
        } catch (err) {
            console.error('Error creating clip:', err);
            const message = err instanceof Error ? err.message : 'Failed to create clip. Please try again.';
            alert(message);
        } finally {
            setUploading(false);
            setTimeout(() => setGenerateProgress(null), 500);
        }
    };

    const handleSelfDestruct = async () => {
        if (!clip) return;

        const confirmWipe = window.confirm(
            'Are you sure you want to self-destruct and permanently wipe this share right now? All files and text will be deleted immediately.'
        );
        if (!confirmWipe) return;

        let pinToUse: string | undefined = deletePin.trim() || undefined;
        const creatorToken = localStorage.getItem('creatorToken_' + clip.code) || undefined;

        if (clip.hasDeletePin && !pinToUse && !creatorToken) {
            const entered = window.prompt('Enter the Self-Destruct PIN to confirm wipe:');
            if (!entered) return;
            pinToUse = entered.trim();
        }

        setIsDestroying(true);
        try {
            await destroyClip(clip.code, pinToUse, creatorToken);
            showToast('Share permanently wiped and destroyed');
            setClip(null);
            setTextContent('');
            setSelectedFiles([]);
            setDeletePin('');
            localStorage.removeItem('clipSessionId');
            localStorage.removeItem('clipId');
            localStorage.removeItem('creatorToken_' + clip.code);
            localStorage.removeItem('lastShare');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to destroy share.';
            alert(msg);
        } finally {
            setIsDestroying(false);
        }
    };

    const copyValue = async (text: string, which: 'code' | 'link') => {
        try {
            await navigator.clipboard.writeText(text);
            showToast(which === 'code' ? 'Share code copied' : 'Share link copied');
            if (which === 'code') {
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
            } else {
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
            }
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const shareLink = async (url: string, code: string) => {
        try {
            if (typeof navigator !== 'undefined' && navigator.share) {
                await navigator.share({ title: 'Pasteport', text: `View my shared content — code ${code}`, url });
            } else {
                await copyValue(url, 'link');
            }
        } catch {
            /* user dismissed share sheet */
        }
    };

    const handleRemoveFile = async (fileUrl: string) => {
        if (!clip) return;
        try {
            await removeFileFromClip(clip.id, fileUrl);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to remove file. Please try again.';
            alert(message);
        }
    };

    const expirationOptions = [
        { label: '1 hour', value: 1 },
        { label: '3 hours', value: 3 },
        { label: '6 hours', value: 6 },
        { label: '12 hours', value: 12 },
        { label: '24 hours', value: 24 },
    ];

    return (
        <div className="relative flex min-h-screen flex-col overflow-x-clip bg-[radial-gradient(1000px_500px_at_15%_-10%,#dbeafe_0%,transparent_55%),radial-gradient(900px_500px_at_100%_0%,#ede9fe_0%,transparent_50%)] bg-slate-50">
            {/* Global Drop Overlay */}
            {isDraggingOver && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-blue-600/90 p-6 text-white backdrop-blur-sm transition-all">
                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/20 shadow-2xl animate-bounce">
                        <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold tracking-tight">Drop files anywhere to share</h2>
                    <p className="mt-2 text-sm text-blue-100">Files will be attached instantly to your clipboard</p>
                </div>
            )}

            {/* Header */}
            <header className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-6">
                <Logo size={40} className="sm:hidden" />
                <Logo size={50} className="hidden sm:flex" />
                <div className="flex items-center gap-3">
                    {/* Step indicator */}
                    <div className="hidden items-center gap-2 text-xs font-semibold text-gray-500 sm:flex">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] text-white ${!clip ? 'bg-blue-600' : 'bg-emerald-500'}`}>
                            {clip ? '✓' : '1'}
                        </span>
                        Compose
                        <span className="h-0.5 w-6 bg-gray-200" />
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${clip ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>2</span>
                        <span className={clip ? 'text-gray-700' : 'text-gray-400'}>Get code</span>
                    </div>
                    <button
                        onClick={() => { startNavigation(); router.push('/'); }}
                        className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-md transition-all hover:bg-gray-50 active:scale-95 sm:px-4 sm:text-sm"
                    >
                        ← Back
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex min-h-[calc(100vh-100px)] items-start justify-center px-4 py-6 sm:min-h-[calc(100vh-120px)]">
                <div className={`w-full space-y-4 transition-[max-width] duration-300 sm:space-y-6 ${clip ? 'max-w-5xl' : 'max-w-3xl'}`}>
                    {!clip ? (
                        <>
                            <div className="text-center">
                                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                                    Share{' '}
                                    <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                                        anything
                                    </span>
                                    , instantly
                                </h1>
                                <p className="mt-2 text-sm text-gray-500 sm:text-base">
                                    Paste anything with <kbd className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-semibold font-mono text-slate-700">Ctrl + V</kbd> or drag & drop anywhere.
                                </p>
                            </div>

                            {/* Unified Composer Card */}
                            <div className="rounded-3xl border border-slate-100 bg-white p-2 shadow-[0_20px_50px_rgba(2,6,23,0.10)]">
                                {/* Tab switcher */}
                                <div className="m-1.5 flex gap-1.5 rounded-2xl bg-slate-100 p-1.5">
                                    {([
                                        { key: 'text', label: '📝 Text' },
                                        { key: 'files', label: '📎 Files' },
                                        { key: 'both', label: '✳️ Both' },
                                    ] as const).map((t) => (
                                        <button
                                            key={t.key}
                                            onClick={() => setActiveTab(t.key)}
                                            className={`flex-1 rounded-xl px-2 py-2.5 text-xs font-bold transition-all sm:text-sm ${activeTab === t.key
                                                ? 'bg-white text-blue-800 shadow'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>

                                <div key={activeTab} className="animate-tab-in space-y-4 p-3 sm:p-4">
                                    {/* Text zone */}
                                    {showText && (
                                        <textarea
                                            value={textContent}
                                            onChange={(e) => setTextContent(e.target.value)}
                                            placeholder="Type, write code, or press Ctrl + V anywhere to paste screenshot/text..."
                                            className="h-40 w-full rounded-2xl border-2 border-gray-200 p-4 text-gray-800 focus:border-blue-500 focus:outline-none sm:h-48"
                                        />
                                    )}

                                    {/* File attach strip */}
                                    {showFiles && (
                                        <FileUpload
                                            variant="compact"
                                            onFileSelect={(files) => setSelectedFiles([...selectedFiles, ...files])}
                                            disabled={loading || uploading}
                                        />
                                    )}

                                    {/* Selected files list */}
                                    {showFiles && selectedFiles.length > 0 && (
                                        <div className="space-y-2">
                                            {selectedFiles.map((file, index) => (
                                                <div key={index} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-2.5">
                                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-base">
                                                        {fileEmoji(file.name)}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-semibold text-gray-700">{file.name}</p>
                                                        <p className="text-xs text-gray-400">{formatBytes(file.size)} · {typeof uploadProgress[getFileKey(file, index)] === 'number' ? 'uploading' : 'ready'}</p>
                                                        <UploadProgressLine progress={uploadProgress[getFileKey(file, index)]} />
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                                                        disabled={uploading}
                                                        className="ml-1 flex-shrink-0 text-gray-300 transition-colors hover:text-red-500 disabled:opacity-40"
                                                        aria-label={`Remove ${file.name}`}
                                                    >
                                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Expiration & Security Card */}
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-slate-800">⏳ Auto-Expiry Window</span>
                                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                                                    {expirationHours}h
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {expirationOptions.map((opt) => (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => setExpirationHours(opt.value)}
                                                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${expirationHours === opt.value
                                                            ? 'bg-blue-600 text-white shadow-xs'
                                                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                                            }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-slate-500">
                                            Access is revoked immediately once {expirationHours} hour{expirationHours > 1 ? 's' : ''} pass. Cleaned up permanently from server storage.
                                        </p>

                                        {/* Optional Self-Destruct PIN Toggle */}
                                        <div className="border-t border-slate-200/60 pt-3">
                                            <button
                                                type="button"
                                                onClick={() => setShowSecurityOptions(!showSecurityOptions)}
                                                className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800"
                                            >
                                                <span>{showSecurityOptions ? '▼' : '▶'}</span>
                                                <span>Self-Destruct PIN / Duress Wipe {deletePin ? '(Enabled)' : '(Optional)'}</span>
                                            </button>

                                            {showSecurityOptions && (
                                                <div className="mt-2 space-y-2 rounded-xl border border-slate-200 bg-white p-3 animate-fadeIn">
                                                    <label className="block text-xs font-semibold text-slate-700">
                                                        Set Secret Deletion PIN (4-8 characters)
                                                    </label>
                                                    <input
                                                        type="password"
                                                        value={deletePin}
                                                        onChange={(e) => setDeletePin(e.target.value)}
                                                        placeholder="e.g. 9842 or secret-key"
                                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 focus:border-blue-500 focus:outline-none"
                                                    />
                                                    <p className="text-[11px] text-slate-500">
                                                        Setting a PIN allows you to manually revoke and wipe this paste from the viewer page at any time before its expiry window lapses.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status chips */}
                                    <div className="flex flex-wrap gap-2">
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-gray-500">⚡ Real-time editing</span>
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-gray-500">📋 Ctrl+V paste anywhere</span>
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-gray-500">🛡️ Sandboxed R2 storage</span>
                                    </div>
                                </div>

                                {/* Footer: quota meter + generate */}
                                <div className="flex flex-col gap-4 border-t border-slate-100 p-3 sm:flex-row sm:items-center sm:p-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span><b className="text-gray-700">10 MB</b> per-file limit</span>
                                            <span>{formatBytes(showFiles ? selectedBytes : 0)} selected</span>
                                        </div>
                                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 transition-all"
                                                style={{ width: `${showFiles ? Math.min(100, (selectedBytes / SIZE_METER_MAX_BYTES) * 100) : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleGenerateCode}
                                        disabled={loading || uploading || (!(showText && textContent.trim()) && !(showFiles && selectedFiles.length > 0))}
                                        className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-500/30 transition-all hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        {loading || uploading ? 'Generating...' : 'Generate Share Code'}
                                    </button>
                                </div>
                                {generateProgress && (
                                    <GenerateProgressPanel progress={generateProgress.value} label={generateProgress.label} />
                                )}
                            </div>

                            {error && (
                                <div className="rounded-lg bg-red-50 p-4 text-red-600">
                                    {error}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="text-center">
                                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                                    Your{' '}
                                    <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                                        share code
                                    </span>
                                    {' '}is ready 🎉
                                </h1>
                                <p className="mt-2 text-sm text-gray-500 sm:text-base">
                                    Share the code or link — keep editing below, changes sync live.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
                                {/* LEFT: keep editing */}
                                <div className="order-2 space-y-4 lg:order-1">
                                    {/* Editable Text */}
                                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lg sm:p-6">
                                        <h3 className="mb-3 flex items-center gap-2 text-base font-extrabold text-gray-800">
                                            📝 Text Content
                                            {(clip.type === 'text' || clip.type === 'both') && (
                                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">● LIVE</span>
                                            )}
                                        </h3>
                                        <textarea
                                            value={textContent}
                                            onChange={(e) => handleTextChange(e.target.value)}
                                            placeholder={clip.type === 'file' ? 'Add text content here...' : ''}
                                            className="h-48 w-full rounded-xl border-2 border-gray-200 p-4 text-gray-800 focus:border-blue-500 focus:outline-none"
                                        />
                                        {(clip.type === 'text' || clip.type === 'both') && (
                                            <p className="mt-2 text-xs text-gray-400">
                                                💡 Changes are saved automatically and updated in real-time
                                            </p>
                                        )}
                                    </div>

                                    {/* Files */}
                                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lg sm:p-6">
                                        <h3 className="mb-3 flex items-center gap-2 text-base font-extrabold text-gray-800">
                                            📎 File Attachments
                                        </h3>

                                        {(clip.type === 'file' || clip.type === 'both') && clip.files && clip.files.length > 0 && (
                                            <div className="mb-3 space-y-2">
                                                {clip.files.map((file, index) => (
                                                    <div key={index} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                                                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-base">
                                                            {fileEmoji(file.fileName)}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-semibold text-gray-700">{file.fileName}</p>
                                                            <p className="text-xs text-gray-400">
                                                                {file.fileType || 'File'}{file.fileSize ? ` · ${formatBytes(file.fileSize)}` : ''}
                                                            </p>
                                                        </div>
                                                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-sm font-bold text-blue-600 hover:text-blue-700">
                                                            View
                                                        </a>
                                                        <button
                                                            onClick={() => handleRemoveFile(file.url)}
                                                            disabled={loading || uploading}
                                                            title="Remove file"
                                                            aria-label={`Remove ${file.fileName}`}
                                                            className="flex-shrink-0 text-gray-300 transition-colors hover:text-red-500 disabled:opacity-40"
                                                        >
                                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <FileUpload
                                            variant="compact"
                                            onFileSelect={handleFileUploadAfterGenerate}
                                            disabled={loading || uploading}
                                        />
                                        {liveUploadingFiles.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {liveUploadingFiles.map((file, index) => (
                                                    <div key={getFileKey(file, index)} className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-base">
                                                                {fileEmoji(file.name)}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-sm font-semibold text-gray-700">{file.name}</p>
                                                                <p className="text-xs text-gray-400">{formatBytes(file.size)} · uploading</p>
                                                                <UploadProgressLine progress={uploadProgress[getFileKey(file, index)] || 1} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Create Another & Self-Destruct */}
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => {
                                                setClip(null);
                                                setTextContent('');
                                                setSelectedFiles([]);
                                                localStorage.removeItem('clipSessionId');
                                                localStorage.removeItem('clipId');
                                            }}
                                            className="w-full rounded-2xl border-2 border-gray-200 bg-white px-6 py-3 font-bold text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-95"
                                        >
                                            ↻ Create Another Share
                                        </button>
                                    </div>
                                </div>

                                {/* RIGHT: share card */}
                                <ShareCodeCard
                                    code={clip.code}
                                    copiedCode={copiedCode}
                                    copiedLink={copiedLink}
                                    onCopyCode={() => copyValue(clip.code, 'code')}
                                    onCopyLink={(url) => copyValue(url, 'link')}
                                    onShare={shareLink}
                                    expirationHours={clip.expirationHours || expirationHours}
                                    hasDeletePin={clip.hasDeletePin}
                                    onDestroy={handleSelfDestruct}
                                    isDestroying={isDestroying}
                                />
                            </div>
                        </>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
