'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import FileUpload from '@/components/FileUpload';
import CodeDisplay from '@/components/CodeDisplay';
import { useClipboard, Clip } from '@/hooks/useClipboard';
import { uploadFile } from '@/lib/fileHandler';

export default function SendPage() {
    const router = useRouter();
    const { createClip, updateClip, subscribeToClip, loading, error } = useClipboard();

    const [mode, setMode] = useState<'select' | 'text' | 'file'>('select');
    const [textContent, setTextContent] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [clip, setClip] = useState<Clip | null>(null);
    const [uploading, setUploading] = useState(false);
    const [sessionId] = useState(() => Math.random().toString(36).substring(7));

    // Subscribe to real-time updates
    useEffect(() => {
        if (clip) {
            const unsubscribe = subscribeToClip(clip.id, (updatedClip) => {
                setClip(updatedClip);
                if (updatedClip.type === 'text') {
                    setTextContent(updatedClip.content);
                }
            });

            // Store session ID in localStorage
            localStorage.setItem('clipSessionId', sessionId);
            localStorage.setItem('clipId', clip.id);

            return () => unsubscribe();
        }
    }, [clip, subscribeToClip, sessionId]);

    const handleGenerateCode = async () => {
        if (mode === 'text' && !textContent.trim()) {
            alert('Please enter some text');
            return;
        }

        if (mode === 'file' && !selectedFile) {
            alert('Please select a file');
            return;
        }

        setUploading(true);

        try {
            if (mode === 'text') {
                const newClip = await createClip(textContent, 'text');
                setClip(newClip);
            } else if (mode === 'file' && selectedFile) {
                // Upload file to Firebase Storage
                const fileResult = await uploadFile(selectedFile, 'temp');

                // Create clip with file URL
                const newClip = await createClip(fileResult.url, 'file', {
                    fileName: fileResult.fileName,
                    fileType: fileResult.fileType,
                });

                setClip(newClip);
            }
        } catch (err) {
            console.error('Error creating clip:', err);
            alert('Failed to create clip. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleTextChange = async (newText: string) => {
        setTextContent(newText);

        // Update Firestore in real-time if clip exists
        if (clip && clip.type === 'text') {
            try {
                await updateClip(clip.id, newText);
            } catch (err) {
                console.error('Error updating clip:', err);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
            {/* Header */}
            <header className="flex items-center justify-between p-6">
                <Logo size={50} />
                <button
                    onClick={() => router.push('/')}
                    className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-md transition-all hover:bg-gray-50 active:scale-95"
                >
                    ← Back to Home
                </button>
            </header>

            {/* Main Content */}
            <main className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4">
                <div className="w-full max-w-2xl space-y-6">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-800">Send File or Text</h1>
                        <p className="mt-2 text-gray-600">
                            Choose how you want to share your content
                        </p>
                    </div>

                    {!clip ? (
                        <>
                            {/* Mode Selection */}
                            {mode === 'select' && (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <button
                                        onClick={() => setMode('text')}
                                        className="group rounded-2xl bg-white p-8 shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-100"
                                    >
                                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                                            <svg
                                                className="h-8 w-8 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800">Write Text</h3>
                                        <p className="mt-2 text-sm text-gray-600">
                                            Type or paste your text directly
                                        </p>
                                    </button>

                                    <button
                                        onClick={() => setMode('file')}
                                        className="group rounded-2xl bg-white p-8 shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-100"
                                    >
                                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                                            <svg
                                                className="h-8 w-8 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800">Upload File</h3>
                                        <p className="mt-2 text-sm text-gray-600">
                                            Upload text, PDF, or image files
                                        </p>
                                    </button>
                                </div>
                            )}

                            {/* Text Input Mode */}
                            {mode === 'text' && (
                                <div className="space-y-4 rounded-2xl bg-white p-6 shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-800">Write Your Text</h3>
                                        <button
                                            onClick={() => {
                                                setMode('select');
                                                setTextContent('');
                                            }}
                                            className="text-sm text-gray-500 hover:text-gray-700"
                                        >
                                            Change Mode
                                        </button>
                                    </div>
                                    <textarea
                                        value={textContent}
                                        onChange={(e) => setTextContent(e.target.value)}
                                        placeholder="Type or paste your text here..."
                                        className="h-64 w-full rounded-lg border-2 border-gray-200 p-4 text-gray-800 focus:border-blue-500 focus:outline-none"
                                    />
                                    <button
                                        onClick={handleGenerateCode}
                                        disabled={loading || uploading || !textContent.trim()}
                                        className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 font-semibold text-white transition-all hover:from-blue-600 hover:to-purple-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {loading || uploading ? 'Generating...' : 'Generate Send Code'}
                                    </button>
                                </div>
                            )}

                            {/* File Upload Mode */}
                            {mode === 'file' && (
                                <div className="space-y-4 rounded-2xl bg-white p-6 shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-800">Upload Your File</h3>
                                        <button
                                            onClick={() => {
                                                setMode('select');
                                                setSelectedFile(null);
                                            }}
                                            className="text-sm text-gray-500 hover:text-gray-700"
                                        >
                                            Change Mode
                                        </button>
                                    </div>
                                    <FileUpload
                                        onFileSelect={setSelectedFile}
                                        disabled={loading || uploading}
                                    />
                                    {selectedFile && (
                                        <div className="rounded-lg bg-blue-50 p-4">
                                            <p className="text-sm font-semibold text-gray-700">Selected File:</p>
                                            <p className="text-sm text-gray-600">{selectedFile.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    )}
                                    <button
                                        onClick={handleGenerateCode}
                                        disabled={loading || uploading || !selectedFile}
                                        className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-all hover:from-purple-600 hover:to-pink-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {loading || uploading ? 'Uploading...' : 'Generate Send Code'}
                                    </button>
                                </div>
                            )}

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

                            {/* Editable Text Area (if text mode) */}
                            {clip.type === 'text' && (
                                <div className="rounded-2xl bg-white p-6 shadow-lg">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-800">
                                        Your Text (Editable until refresh)
                                    </h3>
                                    <textarea
                                        value={textContent}
                                        onChange={(e) => handleTextChange(e.target.value)}
                                        className="h-64 w-full rounded-lg border-2 border-gray-200 p-4 text-gray-800 focus:border-blue-500 focus:outline-none"
                                    />
                                    <p className="mt-2 text-sm text-gray-500">
                                        💡 Changes are saved automatically and updated in real-time
                                    </p>
                                </div>
                            )}

                            {/* File Preview */}
                            {clip.type === 'file' && (
                                <div className="rounded-2xl bg-white p-6 shadow-lg">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-800">File Uploaded</h3>
                                    <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
                                        <svg className="h-12 w-12 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                                            <path d="M14 2v6h6" />
                                        </svg>
                                        <div>
                                            <p className="font-semibold text-gray-700">{clip.fileName}</p>
                                            <p className="text-sm text-gray-500">{clip.fileType}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Create Another */}
                            <button
                                onClick={() => {
                                    setClip(null);
                                    setMode('select');
                                    setTextContent('');
                                    setSelectedFile(null);
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
