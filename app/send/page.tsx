'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import FileUpload from '@/components/FileUpload';
import CodeDisplay from '@/components/CodeDisplay';
import { useClipboard, Clip } from '@/hooks/useClipboard';
import { uploadFile, FileUploadResult } from '@/lib/fileHandler';

export default function SendPage() {
    const router = useRouter();
    const { createClip, updateClip, updateClipWithFile, subscribeToClip, loading, error } = useClipboard();

    const [textContent, setTextContent] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [clip, setClip] = useState<Clip | null>(null);
    const [uploading, setUploading] = useState(false);
    const [sessionId] = useState(() => Math.random().toString(36).substring(7));
    const [activeTab, setActiveTab] = useState<'text' | 'files' | 'both'>('both');

    const DAILY_LIMIT_BYTES = 10 * 1024 * 1024;
    const selectedBytes = selectedFiles.reduce((sum, f) => sum + f.size, 0);
    const showText = activeTab === 'text' || activeTab === 'both';
    const showFiles = activeTab === 'files' || activeTab === 'both';

    const formatBytes = (bytes: number) => {
        if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${bytes} B`;
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

            // Store session ID in localStorage
            localStorage.setItem('clipSessionId', sessionId);
            localStorage.setItem('clipId', clip.id);

            return () => unsubscribe();
        }
    }, [clip?.id, subscribeToClip, sessionId]);

    const handleGenerateCode = async () => {
        // Respect the active tab: the Text tab shares text only, the Files tab
        // shares files only, Both shares whatever is provided.
        const hasText = showText && textContent.trim().length > 0;
        const hasFiles = showFiles && selectedFiles.length > 0;

        if (!hasText && !hasFiles) {
            alert('Please enter some text or select at least one file');
            return;
        }

        setUploading(true);

        try {
            let uploadedFiles: FileUploadResult[] = [];

            // Upload all selected files
            if (hasFiles) {
                const uploadPromises = selectedFiles.map(file => uploadFile(file, 'temp'));
                const results = await Promise.all(uploadPromises);
                uploadedFiles = results;
            }

            // Determine type and create clip
            let newClip;
            if (hasText && hasFiles) {
                // Both text and files
                newClip = await createClip(
                    uploadedFiles[0].url,
                    'both',
                    uploadedFiles,
                    textContent
                );
            } else if (hasFiles) {
                // Files only
                newClip = await createClip(uploadedFiles[0].url, 'file', uploadedFiles);
            } else {
                // Text only
                newClip = await createClip(textContent, 'text');
            }

            setClip(newClip);
            setSelectedFiles([]); // Clear file selection after upload
        } catch (err) {
            console.error('Error creating clip:', err);
            const message = err instanceof Error ? err.message : 'Failed to create clip. Please try again.';
            alert(message);
        } finally {
            setUploading(false);
        }
    };

    const handleTextChange = async (newText: string) => {
        setTextContent(newText);

        // Update Firestore in real-time if clip exists
        if (clip) {
            try {
                await updateClip(clip.id, newText);
            } catch (err) {
                console.error('Error updating clip:', err);
            }
        }
    };

    const handleFileUploadAfterGenerate = async (files: File[]) => {
        if (!clip || files.length === 0) return;

        setUploading(true);
        try {
            const uploadPromises = files.map(file => uploadFile(file, 'temp'));
            const results = await Promise.all(uploadPromises);

            // Update the clip with new files
            await updateClipWithFile(clip.id, results, textContent);

            // The clip will be updated via the real-time subscription
        } catch (err) {
            console.error('Error uploading files:', err);
            const message = err instanceof Error ? err.message : 'Failed to upload files. Please try again.';
            alert(message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(1000px_500px_at_15%_-10%,#dbeafe_0%,transparent_55%),radial-gradient(900px_500px_at_100%_0%,#ede9fe_0%,transparent_50%)] bg-slate-50">
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
                        onClick={() => router.push('/')}
                        className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-md transition-all hover:bg-gray-50 active:scale-95 sm:px-4 sm:text-sm"
                    >
                        ← Back
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex min-h-[calc(100vh-100px)] items-start justify-center px-4 py-6 sm:min-h-[calc(100vh-120px)]">
                <div className="w-full max-w-3xl space-y-4 sm:space-y-6">
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
                                    One place for text and files. We generate a short code + link to share.
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
                                            placeholder="Type or paste text, code, or a note here..."
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
                                                        <p className="text-xs text-gray-400">{formatBytes(file.size)} · ready</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                                                        className="ml-1 flex-shrink-0 text-gray-300 transition-colors hover:text-red-500"
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

                                    {/* Status chips */}
                                    <div className="flex flex-wrap gap-2">
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-gray-500">🔒 Expires in 24h</span>
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-gray-500">⚡ Real-time editing</span>
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-gray-500">🔗 Shareable link</span>
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
                                                style={{ width: `${showFiles ? Math.min(100, (selectedBytes / DAILY_LIMIT_BYTES) * 100) : 0}%` }}
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
                            </div>

                            {error && (
                                <div className="rounded-lg bg-red-50 p-4 text-red-600">
                                    {error}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Code Display */}
                            <CodeDisplay
                                code={clip.code}
                                shareUrl={`${window.location.origin}/view/${clip.code}`}
                            />

                            {/* Two-column grid: live-editable text on the left, files on the right */}
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
                                {/* Editable Text Area - Always visible */}
                                <div className="rounded-2xl bg-white p-6 shadow-lg">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-800">
                                        📝 Text Content {(clip.type === 'text' || clip.type === 'both') && '(Editable in real-time)'}
                                    </h3>
                                    <textarea
                                        value={textContent}
                                        onChange={(e) => handleTextChange(e.target.value)}
                                        placeholder={clip.type === 'file' ? 'Add text content here...' : ''}
                                        className="h-64 w-full rounded-lg border-2 border-gray-200 p-4 text-gray-800 focus:border-blue-500 focus:outline-none"
                                    />
                                    {(clip.type === 'text' || clip.type === 'both') && (
                                        <p className="mt-2 text-sm text-gray-500">
                                            💡 Changes are saved automatically and updated in real-time
                                        </p>
                                    )}
                                </div>

                                {/* File Section - Always visible */}
                                <div className="rounded-2xl bg-white p-6 shadow-lg">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-800">
                                        📎 File Attachments
                                    </h3>

                                    {(clip.type === 'file' || clip.type === 'both') && clip.files && clip.files.length > 0 ? (
                                        <div className="space-y-3">
                                            <p className="text-sm text-gray-600">
                                                {clip.files.length} {clip.files.length === 1 ? 'file' : 'files'} attached
                                            </p>
                                            <div className="max-h-60 space-y-2 overflow-y-auto">
                                                {clip.files.map((file, index) => (
                                                    <div key={index} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                                                        <svg className="h-8 w-8 flex-shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                                                            <path d="M14 2v6h6" />
                                                        </svg>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate font-semibold text-gray-700">{file.fileName}</p>
                                                            <p className="text-xs text-gray-500">{file.fileType}</p>
                                                        </div>
                                                        <a
                                                            href={file.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex-shrink-0 text-sm text-blue-500 hover:text-blue-700"
                                                        >
                                                            View
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Upload more files */}
                                            <div className="pt-3">
                                                <p className="mb-2 text-sm text-gray-600">Upload more files:</p>
                                                <FileUpload
                                                    onFileSelect={handleFileUploadAfterGenerate}
                                                    disabled={loading || uploading}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="mb-3 text-sm text-gray-600">No files attached yet. Upload to add to this share:</p>
                                            <FileUpload
                                                onFileSelect={handleFileUploadAfterGenerate}
                                                disabled={loading || uploading}
                                            />
                                        </div>
                                    )}

                                    {uploading && (
                                        <div className="mt-3 text-center">
                                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                                            <p className="mt-2 text-sm text-gray-600">Uploading files...</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Create Another */}
                            <button
                                onClick={() => {
                                    setClip(null);
                                    setTextContent('');
                                    setSelectedFiles([]);
                                    localStorage.removeItem('clipSessionId');
                                    localStorage.removeItem('clipId');
                                }}
                                className="w-full rounded-lg border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 active:scale-95"
                            >
                                Create Another Share
                            </button>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

