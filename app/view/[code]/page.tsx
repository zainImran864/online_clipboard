'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import ContentViewer from '@/components/ContentViewer';
import { useClipboard, Clip } from '@/hooks/useClipboard';
import { startNavigation } from '@/lib/appEvents';

export default function ViewPage() {
    const params = useParams();
    const router = useRouter();
    const code = params.code as string;

    const { fetchClipByCode, subscribeToClip, loading } = useClipboard();
    const [clip, setClip] = useState<Clip | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [isLiveMode, setIsLiveMode] = useState(false);

    useEffect(() => {
        if (!code) return;
        let cancelled = false;
        (async () => {
            try {
                const fetchedClip = await fetchClipByCode(code);
                if (cancelled) return;
                if (fetchedClip) {
                    setClip(fetchedClip);
                } else {
                    setNotFound(true);
                }
            } catch (err) {
                if (cancelled) return;
                console.error('Error fetching clip:', err);
                setNotFound(true);
            }
        })();
        return () => { cancelled = true; };
    }, [code, fetchClipByCode]);

    // Subscribe to real-time updates when live mode is enabled
    useEffect(() => {
        if (clip?.id && isLiveMode) {
            const unsubscribe = subscribeToClip(clip.id, (updatedClip) => {
                setClip(updatedClip);
            });

            return () => unsubscribe();
        }
    }, [clip?.id, isLiveMode, subscribeToClip]);

    const toggleLiveMode = () => {
        setIsLiveMode(!isLiveMode);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-blue-50">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                    <p className="text-lg font-semibold text-gray-700">Loading shared content...</p>
                </div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen bg-blue-50">
                <header className="p-6">
                    <Logo size={50} />
                </header>
                <main className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4">
                    <div className="w-full max-w-md space-y-6 text-center">
                        <div className="rounded-2xl bg-white p-8 shadow-lg">
                            <svg
                                className="mx-auto mb-4 h-20 w-20 text-red-500"
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
                            <h1 className="mb-2 text-2xl font-bold text-gray-800">Content Not Found</h1>
                            <p className="text-gray-600">
                                This link is invalid or the content has expired.
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <button
                                onClick={() => { startNavigation(); router.push('/read'); }}
                                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-700 active:scale-95"
                            >
                                Try Another Code
                            </button>
                            <button
                                onClick={() => { startNavigation(); router.push('/send'); }}
                                className="rounded-lg border border-blue-100 bg-white px-6 py-3 font-semibold text-blue-700 shadow-sm transition-all hover:bg-blue-50 active:scale-95"
                            >
                                Create New Share
                            </button>
                        </div>
                        <button
                            onClick={() => { startNavigation(); router.push('/'); }}
                            className="w-full rounded-lg bg-slate-100 px-6 py-3 font-semibold text-slate-600 transition-all hover:bg-slate-200 active:scale-95"
                        >
                            Go to Home
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen overflow-x-clip bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
            {/* Header */}
            <header className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-6">
                <Logo size={40} className="sm:hidden" />
                <Logo size={50} className="hidden sm:flex" />
                <button
                    onClick={() => { startNavigation(); router.push('/'); }}
                    className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-md transition-all hover:bg-gray-50 active:scale-95 sm:px-4 sm:text-sm"
                >
                    ← Back
                </button>
            </header>

            {/* Main Content */}
            <main className="flex min-h-[calc(100vh-100px)] items-start justify-center px-4 py-6 sm:min-h-[calc(100vh-120px)]">
                <div className="w-full max-w-6xl space-y-4 sm:space-y-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                            Read{' '}
                            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                                live
                            </span>
                            {' '}content
                        </h1>
                        <p className="mt-2 text-sm text-gray-500 sm:text-base">
                            Viewing code <span className="font-mono font-bold tracking-widest text-blue-800">{code}</span>
                            {clip?.expiresAt && <> · expires {clip.expiresAt.toLocaleString()}</>}
                        </p>
                    </div>

                    {clip && (
                        <>
                            {/* Live Mode Banner */}
                            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-lg sm:p-5">
                                <div className="flex items-center gap-3">
                                    <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${isLiveMode ? 'animate-pulse bg-green-500 ring-4 ring-green-500/20' : 'bg-gray-300'}`} />
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-700 sm:text-base">
                                            Real-Time Updates {isLiveMode && '· Live'}
                                        </h3>
                                        <p className="text-xs text-gray-400 sm:text-sm">
                                            {isLiveMode
                                                ? 'Text & previews refresh automatically as the sender edits'
                                                : 'Enable to see changes as the sender edits'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleLiveMode}
                                    className={`flex-shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all active:scale-95 sm:px-6 ${isLiveMode
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {isLiveMode ? '✓ Live' : 'Enable Live'}
                                </button>
                            </div>

                            <ContentViewer clip={clip} />
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
