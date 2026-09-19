'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import Footer from '@/components/Footer';
import ContentViewer from '@/components/ContentViewer';
import ClipboardMiniGame from '@/components/ClipboardMiniGame';
import { useClipboard, Clip } from '@/hooks/useClipboard';
import { showToast, startNavigation } from '@/lib/appEvents';

function formatRemainingTime(ms: number): string {
    if (ms <= 0) return 'Expired';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
}

export default function ViewPage() {
    const params = useParams();
    const router = useRouter();
    const code = params.code as string;

    const { fetchClipByCode, subscribeToClip, destroyClip, loading } = useClipboard();
    const [clip, setClip] = useState<Clip | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [isExpired, setIsExpired] = useState(false);
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [remainingMs, setRemainingMs] = useState<number | null>(null);
    const [isDestroying, setIsDestroying] = useState(false);

    // Self-Destruct Modal state
    const [showPinModal, setShowPinModal] = useState(false);
    const [enteredPin, setEnteredPin] = useState('');
    const [pinError, setPinError] = useState<string | null>(null);

    // Access PIN Protection state (4-character PIN)
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [enteredAccessPin, setEnteredAccessPin] = useState('');
    const [accessPinError, setAccessPinError] = useState<string | null>(null);
    const [isVerifyingPin, setIsVerifyingPin] = useState(false);

    useEffect(() => {
        if (!code) return;
        let cancelled = false;
        (async () => {
            try {
                const fetchedClip = await fetchClipByCode(code);
                if (cancelled) return;
                if (fetchedClip) {
                    if (fetchedClip.expiresAt && fetchedClip.expiresAt.getTime() <= Date.now()) {
                        setIsExpired(true);
                        setClip(null);
                    } else {
                        setClip(fetchedClip);
                        if (!fetchedClip.hasAccessPin) {
                            setIsUnlocked(true);
                        } else {
                            setIsUnlocked(false);
                        }
                    }
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

    // Countdown timer & auto-expiration enforcement
    useEffect(() => {
        if (!clip?.expiresAt) return;

        const updateCountdown = () => {
            const diff = clip.expiresAt!.getTime() - Date.now();
            if (diff <= 0) {
                setRemainingMs(0);
                setIsExpired(true);
                setClip(null);
            } else {
                setRemainingMs(diff);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [clip?.expiresAt]);

    // Always subscribe to real-time updates so if the clip is destroyed or PIN toggled,
    // the read side hides all data immediately with zero wait.
    useEffect(() => {
        if (!clip?.id) return;

        const unsubscribe = subscribeToClip(clip.id, (updatedClip) => {
            if (!updatedClip) {
                // Instantly wipe and hide data from user in real time!
                setClip(null);
                setIsExpired(true);
                showToast('Share was self-destructed and wiped');
                return;
            }

            if (updatedClip.expiresAt && updatedClip.expiresAt.getTime() <= Date.now()) {
                setClip(null);
                setIsExpired(true);
                return;
            }

            // Real-time access PIN locking:
            // If sender enables PIN at runtime, instantly lock reader and show PIN prompt!
            if (updatedClip.hasAccessPin && !clip.hasAccessPin) {
                setIsUnlocked(false);
                setEnteredAccessPin('');
                setAccessPinError(null);
                showToast('The sender enabled PIN protection. Enter 4-character PIN to continue.');
            } else if (!updatedClip.hasAccessPin && clip.hasAccessPin) {
                // If sender disabled PIN at runtime, instantly unlock!
                setIsUnlocked(true);
                showToast('PIN protection was removed by the sender.');
            }

            if (isLiveMode || !isUnlocked) {
                setClip(updatedClip);
            }
        });

        return () => unsubscribe();
    }, [clip?.id, clip?.hasAccessPin, isLiveMode, isUnlocked, subscribeToClip]);

    const toggleLiveMode = () => {
        setIsLiveMode(!isLiveMode);
    };

    const handleConfirmDestruction = async () => {
        if (!code) return;

        setIsDestroying(true);
        setPinError(null);

        try {
            const creatorToken = typeof window !== 'undefined' ? localStorage.getItem('creatorToken_' + code) || undefined : undefined;
            await destroyClip(code, enteredPin.trim() || undefined, creatorToken);
            showToast('Share permanently destroyed and wiped');
            setShowPinModal(false);
            setIsExpired(true);
            setClip(null);
            if (typeof window !== 'undefined') {
                localStorage.removeItem('creatorToken_' + code);
                localStorage.removeItem('lastShare');
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Incorrect PIN or failed to destroy share.';
            setPinError(msg);
        } finally {
            setIsDestroying(false);
        }
    };

    const openDestructionFlow = () => {
        setPinError(null);
        setEnteredPin('');
        setShowPinModal(true);
    };

    const handleVerifyAccessPin = async () => {
        if (!code || enteredAccessPin.trim().length !== 4) {
            setAccessPinError('Please enter exactly 4 characters');
            return;
        }

        setIsVerifyingPin(true);
        setAccessPinError(null);

        try {
            const res = await fetch('/api/clips/verify-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    pin: enteredAccessPin.trim(),
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.valid) {
                setAccessPinError(data.error || 'Incorrect 4-character PIN. Please try again.');
                return;
            }

            setIsUnlocked(true);
            showToast('Share unlocked successfully!');
        } catch (err) {
            setAccessPinError(err instanceof Error ? err.message : 'Validation failed. Please try again.');
        } finally {
            setIsVerifyingPin(false);
        }
    };

    if (loading && !clip && !notFound && !isExpired) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-blue-50">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                    <p className="text-lg font-semibold text-gray-700">Loading shared content...</p>
                </div>
            </div>
        );
    }

    if (isExpired) {
        return (
            <div className="flex min-h-screen flex-col bg-slate-50">
                <header className="p-6">
                    <Logo size={50} />
                </header>
                <main className="flex flex-1 items-center justify-center px-4 py-8">
                    <div className="w-full max-w-lg space-y-6 text-center">
                        <div className="rounded-3xl border border-amber-200 bg-white p-8 shadow-xl">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-3xl">
                                ⏳
                            </div>
                            <h1 className="mb-2 text-2xl font-extrabold text-slate-800">Share Expired or Revoked</h1>
                            <p className="text-sm leading-relaxed text-slate-600">
                                This paste has reached its expiration limit or was manually self-destructed.
                                In accordance with Pasteport privacy standards, all files and text have been permanently purged from storage.
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <button
                                onClick={() => { startNavigation(); router.push('/send'); }}
                                className="rounded-xl bg-blue-600 px-6 py-3.5 font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95"
                            >
                                Create New Share
                            </button>
                            <button
                                onClick={() => { startNavigation(); router.push('/'); }}
                                className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
                            >
                                Go to Home
                            </button>
                        </div>

                        {/* Interactive mini-game */}
                        <div className="pt-2">
                            <ClipboardMiniGame />
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="flex min-h-screen flex-col bg-blue-50">
                <header className="p-6">
                    <Logo size={50} />
                </header>
                <main className="flex flex-1 items-center justify-center px-4 py-8">
                    <div className="w-full max-w-lg space-y-6 text-center">
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

                        {/* Interactive mini-game */}
                        <div className="pt-2">
                            <ClipboardMiniGame />
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col overflow-x-clip bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
            {/* PIN Entry Modal for Self-Destruct */}
            {showPinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-fadeIn">
                    <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <span>💥</span>
                                <span>Self-Destruct Share</span>
                            </h3>
                            <button
                                onClick={() => setShowPinModal(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>

                        {clip?.hasDeletePin ? (
                            <>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    A Self-Destruct PIN was configured for this share. Enter the PIN to immediately and permanently wipe this content.
                                </p>
                                <input
                                    type="password"
                                    value={enteredPin}
                                    onChange={(e) => setEnteredPin(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && enteredPin.trim()) {
                                            void handleConfirmDestruction();
                                        }
                                    }}
                                    placeholder="Enter Self-Destruct PIN"
                                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-red-500 focus:outline-none"
                                    autoFocus
                                />
                            </>
                        ) : (
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Are you sure you want to self-destruct and immediately wipe this share? All content and files will be permanently deleted from server storage.
                            </p>
                        )}

                        {pinError && (
                            <p className="text-xs font-semibold text-red-600">{pinError}</p>
                        )}

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setShowPinModal(false)}
                                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDestruction}
                                disabled={isDestroying || (Boolean(clip?.hasDeletePin) && !enteredPin.trim())}
                                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-700 active:scale-95 disabled:opacity-50"
                            >
                                {isDestroying ? 'Wiping...' : 'Destroy Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-6">
                <Logo size={40} className="sm:hidden" />
                <Logo size={50} className="hidden sm:flex" />
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Self-Destruct button ONLY appears if the sender set a Self-Destruct PIN */}
                    {clip?.hasDeletePin && (
                        <button
                            onClick={openDestructionFlow}
                            disabled={isDestroying}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 shadow-xs transition-all hover:bg-red-100 active:scale-95 sm:text-sm"
                            title="Manually destroy this paste"
                        >
                            💥 Self-Destruct
                        </button>
                    )}
                    <button
                        onClick={() => { startNavigation(); router.push('/'); }}
                        className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-md transition-all hover:bg-gray-50 active:scale-95 sm:px-4 sm:text-sm"
                    >
                        ← Back
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex min-h-[calc(100vh-100px)] flex-1 items-start justify-center px-4 py-6 sm:min-h-[calc(100vh-120px)]">
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
                            {remainingMs !== null && (
                                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                                    ⏳ {formatRemainingTime(remainingMs)}
                                </span>
                            )}
                        </p>
                    </div>

                    {clip && (
                        <>
                            {/* Access PIN Lock Screen */}
                            {clip.hasAccessPin && !isUnlocked ? (
                                <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl text-center space-y-5 animate-fadeIn">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
                                        🔐
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                                            4-Character PIN Protected
                                        </h2>
                                        <p className="mt-2 text-xs text-slate-500 sm:text-sm">
                                            The creator protected this share with a 4-character PIN. Enter the PIN to view the content.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            maxLength={4}
                                            value={enteredAccessPin}
                                            onChange={(e) => setEnteredAccessPin(e.target.value.slice(0, 4))}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && enteredAccessPin.trim().length === 4) {
                                                    void handleVerifyAccessPin();
                                                }
                                            }}
                                            placeholder="ABCD"
                                            className="w-full rounded-2xl border-2 border-slate-200 py-3 text-center font-mono text-2xl font-bold tracking-widest text-slate-900 focus:border-blue-500 focus:outline-none"
                                            autoFocus
                                        />

                                        {accessPinError && (
                                            <p className="text-xs font-semibold text-red-600 animate-fadeIn">
                                                {accessPinError}
                                            </p>
                                        )}

                                        <button
                                            onClick={handleVerifyAccessPin}
                                            disabled={isVerifyingPin || enteredAccessPin.trim().length !== 4}
                                            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
                                        >
                                            {isVerifyingPin ? 'Verifying PIN...' : 'Unlock & View Content'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
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
                        </>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
