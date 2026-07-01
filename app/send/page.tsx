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
        const hasText = textContent.trim().length > 0;
        const hasFiles = selectedFiles.length > 0;

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
        <div className="min-h-screen bg-blue-50">
            {/* Header */}
            <header className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-6">
                <Logo size={40} className="sm:hidden" />
                <Logo size={50} className="hidden sm:flex" />
                <button
                    onClick={() => router.push('/')}
                    className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-md transition-all hover:bg-gray-50 active:scale-95 sm:px-4 sm:text-sm"
                >
                    ← Back
                </button>
            </header>

            {/* Main Content */}
            <main className="flex min-h-[calc(100vh-100px)] items-center justify-center px-4 py-6 sm:min-h-[calc(100vh-120px)]">
                <div className="w-full max-w-2xl space-y-4 sm:space-y-6">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl md:text-4xl">Share Content</h1>
                        <p className="mt-2 text-sm text-gray-600 sm:text-base">
                            Write text, upload a file, or do both!
                        </p>
                    </div>

                    {!clip ? (
                        <>
                            {/* Unified Input Interface */}
                            <div className="space-y-4 rounded-2xl bg-white p-4 shadow-lg sm:p-6">
                                {/* Text Input */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        📝 Shareable Text (Optional)
                                    </label>
                                    <textarea
                                        value={textContent}
                                        onChange={(e) => setTextContent(e.target.value)}
                                        placeholder="Type or paste your text here..."
                                        className="h-48 w-full rounded-lg border-2 border-gray-200 p-4 text-gray-800 focus:border-blue-500 focus:outline-none"
                                    />
                                </div>

                                {/* File Upload */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        📎 Upload Files (Optional)
                                    </label>
                                    <FileUpload
                                        onFileSelect={(files) => setSelectedFiles([...selectedFiles, ...files])}
                                        disabled={loading || uploading}
                                    />
                                    {selectedFiles.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-sm font-semibold text-gray-700">
                                                Selected Files ({selectedFiles.length}):
                                            </p>
                                            <div className="max-h-40 space-y-2 overflow-y-auto">
                                                {selectedFiles.map((file, index) => (
                                                    <div key={index} className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-semibold text-gray-700">
                                                                {file.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {(file.size / 1024).toFixed(2)} KB
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                                                            className="ml-2 flex-shrink-0 text-red-500 hover:text-red-700"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setSelectedFiles([])}
                                                className="text-xs text-red-500 hover:text-red-700"
                                            >
                                                Clear all files
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Generate Button */}
                                <button
                                    onClick={handleGenerateCode}
                                    disabled={loading || uploading || (!textContent.trim() && selectedFiles.length === 0)}
                                    className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loading || uploading ? 'Generating...' : 'Generate Share Code'}
                                </button>
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

                            {/* Always show both text and file sections for real-time editing */}
                            <div className="space-y-4">
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

