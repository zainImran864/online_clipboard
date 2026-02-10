'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import ContentViewer from '@/components/ContentViewer';
import { useClipboard } from '@/hooks/useClipboard';

export default function ViewPage() {
    const params = useParams();
    const router = useRouter();
    const code = params.code as string;

    const { fetchClipByCode, subscribeToClip, loading } = useClipboard();
    const [clip, setClip] = useState<any>(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (code) {
            loadClip();
        }
    }, [code]);

    // Subscribe to real-time updates
    useEffect(() => {
        if (clip) {
            const unsubscribe = subscribeToClip(clip.id, (updatedClip) => {
                setClip(updatedClip);
            });

            return () => unsubscribe();
        }
    }, [clip, subscribeToClip]);

    const loadClip = async () => {
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

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                    <p className="text-lg font-semibold text-gray-700">Loading shared content...</p>
                </div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
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
                        <button
                            onClick={() => router.push('/')}
                            className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 font-semibold text-white transition-all hover:from-blue-600 hover:to-purple-600 active:scale-95"
                        >
                            Go to Home
                        </button>
                    </div>
                </main>
            </div>
        );
    }

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
                        <h1 className="text-4xl font-bold text-gray-800">Shared Content</h1>
                        <p className="mt-2 text-gray-600">
                            Code: <span className="font-mono font-bold">{code}</span>
                        </p>
                    </div>

                    {clip && (
                        <>
                            <ContentViewer clip={clip} />

                            {/* Real-time Update Indicator */}
                            <div className="rounded-lg bg-green-50 p-4 text-center text-sm text-green-700">
                                <div className="flex items-center justify-center gap-2">
                                    <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                                    <span>This content updates in real-time</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
