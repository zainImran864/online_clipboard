'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import ContentViewer from '@/components/ContentViewer';
import { useClipboard } from '@/hooks/useClipboard';

export default function ReadPage() {
    const router = useRouter();
    const { fetchClipByCode, subscribeToClip, loading, error } = useClipboard();

    const [code, setCode] = useState('');
    const [clip, setClip] = useState<any>(null);
    const [notFound, setNotFound] = useState(false);
    const [inputMode, setInputMode] = useState<'code' | 'link'>('code');
    const [isLiveMode, setIsLiveMode] = useState(false);

    const handleReadCode = async () => {
        if (!code.trim() || code.length !== 6) {
            alert('Please enter a valid 6-digit code');
            return;
        }

        setNotFound(false);

        try {
            const fetchedClip = await fetchClipByCode(code);

            if (fetchedClip) {
                setClip(fetchedClip);
            } else {
                setNotFound(true);
            }
        } catch (err) {
            console.error('Error fetching clip:', err);
            setNotFound(true);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleReadCode();
        }
    };

    // Subscribe to real-time updates when live mode is enabled
    useEffect(() => {
        if (clip && isLiveMode) {
            const unsubscribe = subscribeToClip(clip.id, (updatedClip) => {
                setClip(updatedClip);
            });
            return () => unsubscribe();
        }
    }, [clip?.id, isLiveMode, subscribeToClip]);

    const toggleLiveMode = () => {
        setIsLiveMode(!isLiveMode);
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
                        <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl md:text-4xl">Read Shared Content</h1>
                        <p className="mt-2 text-sm text-gray-600 sm:text-base">
                            Enter the 6-digit code to view shared content
                        </p>
                    </div>

                    {!clip ? (
                        <>
                            {/* Code Input */}
                            <div className="rounded-2xl bg-white p-4 shadow-lg sm:p-6 md:p-8">
                                {/* Tab Buttons */}
                                <div className="mb-6 flex gap-2 rounded-lg bg-gray-100 p-1">
                                    <button
                                        onClick={() => {
                                            setInputMode('code');
                                            setCode('');
                                            setNotFound(false);
                                        }}
                                        className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-all ${inputMode === 'code'
                                            ? 'bg-white text-gray-800 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-800'
                                            }`}
                                    >
                                        Enter Code
                                    </button>
                                    <button
                                        onClick={() => {
                                            setInputMode('link');
                                            setCode('');
                                            setNotFound(false);
                                        }}
                                        className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-all ${inputMode === 'link'
                                            ? 'bg-white text-gray-800 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-800'
                                            }`}
                                    >
                                        Paste Link
                                    </button>
                                </div>

                                {/* Code Input Mode */}
                                {inputMode === 'code' && (
                                    <>
                                        <label className="mb-3 block text-sm font-semibold text-gray-700">
                                            Enter 6-Digit Code
                                        </label>

                                        {/* Code Input */}
                                        <div className="flex flex-col gap-3 sm:flex-row">
                                            <input
                                                type="text"
                                                value={code}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                    setCode(value);
                                                }}
                                                onKeyPress={handleKeyPress}
                                                placeholder="123456"
                                                maxLength={6}
                                                className="flex-1 rounded-lg border-2 border-gray-200 p-3 text-center font-mono text-xl font-bold tracking-widest text-gray-800 focus:border-blue-500 focus:outline-none sm:p-4 sm:text-2xl"
                                            />
                                            <button
                                                onClick={handleReadCode}
                                                disabled={loading || code.length !== 6}
                                                className="w-full rounded-lg bg-cyan-600 px-6 py-3 font-semibold text-white transition-all hover:bg-cyan-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8 sm:py-4"
                                            >
                                                {loading ? 'Loading...' : 'Read'}
                                            </button>
                                        </div>
                                        <p className="mt-3 text-sm text-gray-500">
                                            💡 The code contains only numbers (6 digits)
                                        </p>
                                    </>
                                )}

                                {/* Link Input Mode */}
                                {inputMode === 'link' && (
                                    <>
                                        <label className="mb-3 block text-sm font-semibold text-gray-700">
                                            Paste Shareable Link
                                        </label>
                                        <div className="flex flex-col gap-3 sm:flex-row">
                                            <input
                                                type="text"
                                                placeholder="Paste shareable link here..."
                                                onChange={(e) => {
                                                    const link = e.target.value;
                                                    // Extract code from URL like: http://localhost:3000/view/123456
                                                    const match = link.match(/\/view\/(\d{6})/);
                                                    if (match) {
                                                        setCode(match[1]);
                                                    } else {
                                                        setCode('');
                                                    }
                                                }}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && code.length === 6) {
                                                        handleReadCode();
                                                    }
                                                }}
                                                className="flex-1 rounded-lg border-2 border-gray-200 p-3 text-sm text-gray-800 focus:border-purple-500 focus:outline-none sm:p-4 sm:text-base"
                                            />
                                            <button
                                                onClick={handleReadCode}
                                                disabled={loading || code.length !== 6}
                                                className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8 sm:py-4"
                                            >
                                                {loading ? 'Loading...' : 'Read'}
                                            </button>
                                        </div>
                                        <p className="mt-3 text-sm text-gray-500">
                                            💡 Paste the full shareable link and the code will be extracted automatically
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Error Messages */}
                            {notFound && (
                                <div className="rounded-lg bg-red-50 p-4 text-center text-red-600">
                                    <svg
                                        className="mx-auto mb-2 h-12 w-12"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <p className="font-semibold">Code not found</p>
                                    <p className="text-sm">
                                        Please check the code and try again. The content may have expired.
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div className="rounded-lg bg-red-50 p-4 text-red-600">
                                    {error}
                                </div>
                            )}

                            {/* Help Section */}
                            <div className="rounded-lg bg-blue-50 p-6">
                                <h3 className="mb-2 font-semibold text-blue-900">How to use:</h3>
                                <ul className="space-y-1 text-sm text-blue-800">
                                    <li>• Ask the sender for the 6-digit code</li>
                                    <li>• Enter the code in the field above</li>
                                    <li>• Click "Read" to view the shared content</li>
                                    <li>• Content is available for 24 hours</li>
                                </ul>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Live Mode Toggle */}
                            <div className="rounded-2xl bg-white p-4 shadow-lg sm:p-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-base font-semibold text-gray-800 sm:text-lg">
                                            Real-Time Updates
                                        </h3>
                                        <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                                            {isLiveMode
                                                ? '🟢 Live mode active - Content updates automatically'
                                                : 'Enable to see changes as the sender edits'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={toggleLiveMode}
                                        className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 sm:w-auto sm:px-6 sm:py-3 ${isLiveMode
                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                    >
                                        {isLiveMode ? '✓ Live' : 'Enable Live'}
                                    </button>
                                </div>
                            </div>

                            {/* Content Display */}
                            <ContentViewer clip={clip} />

                            {/* Read Another */}
                            <button
                                onClick={() => {
                                    setClip(null);
                                    setCode('');
                                    setNotFound(false);
                                    setIsLiveMode(false);
                                }}
                                className="w-full rounded-lg border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 active:scale-95"
                            >
                                Read Another Code
                            </button>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
