'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import Footer from '@/components/Footer';
import QRScannerModal from '@/components/QRScannerModal';
import { useClipboard } from '@/hooks/useClipboard';
import { showToast, startNavigation } from '@/lib/appEvents';
import { getAllOfflineClips, deleteOfflineClip, OfflineClip } from '@/lib/offlineStorage';

export default function ReadPage() {
    const router = useRouter();
    const { fetchClipByCode, loading, error } = useClipboard();

    const [code, setCode] = useState('');
    const [notFound, setNotFound] = useState(false);
    const [inputMode, setInputMode] = useState<'code' | 'link' | 'qr'>('code');
    const [showScanner, setShowScanner] = useState(false);

    // Offline storage state
    const [offlineClips, setOfflineClips] = useState<OfflineClip[]>([]);
    const [isOffline, setIsOffline] = useState(false);

    const loadOfflineClips = useCallback(async () => {
        try {
            const clips = await getAllOfflineClips();
            setOfflineClips(clips);
        } catch {
            // Ignore
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        const updateOnlineStatus = () => {
            setIsOffline(typeof navigator !== 'undefined' ? !navigator.onLine : false);
        };

        updateOnlineStatus();
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        getAllOfflineClips().then((clips) => {
            if (isMounted) {
                setOfflineClips(clips);
            }
        }).catch(() => {});

        return () => {
            isMounted = false;
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    const handleDeleteOffline = async (clipCode: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await deleteOfflineClip(clipCode);
        showToast(`Offline copy for ${clipCode} removed`);
        await loadOfflineClips();
    };

    const handleReadCode = async (codeToRead?: string) => {
        const targetCode = (codeToRead || code).trim();
        if (!targetCode || targetCode.length !== 6) {
            showToast('Please enter a valid 6-digit code');
            return;
        }

        setNotFound(false);

        // If offline, check if saved locally first
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            startNavigation();
            router.push(`/view/${targetCode}`);
            return;
        }

        try {
            const fetchedClip = await fetchClipByCode(targetCode);

            if (fetchedClip) {
                startNavigation();
                router.push(`/view/${targetCode}`);
            } else {
                // If not found in remote, check if saved offline locally
                const hasLocal = offlineClips.some((c) => c.code === targetCode);
                if (hasLocal) {
                    startNavigation();
                    router.push(`/view/${targetCode}`);
                } else {
                    setNotFound(true);
                }
            }
        } catch (err) {
            console.error('Error fetching clip:', err);
            const hasLocal = offlineClips.some((c) => c.code === targetCode);
            if (hasLocal) {
                startNavigation();
                router.push(`/view/${targetCode}`);
            } else {
                setNotFound(true);
            }
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            void handleReadCode();
        }
    };

    const handleScanSuccess = (scannedCode: string) => {
        setCode(scannedCode);
        setShowScanner(false);
        void handleReadCode(scannedCode);
    };

    return (
        <div className="flex min-h-screen flex-col overflow-x-clip bg-[radial-gradient(1000px_500px_at_15%_-10%,#dbeafe_0%,transparent_55%),radial-gradient(900px_500px_at_100%_0%,#ede9fe_0%,transparent_50%)] bg-slate-50">
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

            {/* Offline Status Banner */}
            {isOffline && (
                <div className="mx-auto w-full max-w-2xl px-4">
                    <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800 shadow-xs">
                        <span className="text-base">📶</span>
                        <span>You are currently offline. You can still open and download any saved offline shares below!</span>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex min-h-[calc(100vh-100px)] items-start justify-center px-4 py-6 sm:min-h-[calc(100vh-120px)]">
                <div className="w-full max-w-2xl space-y-4 sm:space-y-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                            Read{' '}
                            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                                shared
                            </span>
                            {' '}content
                        </h1>
                        <p className="mt-2 text-sm text-gray-500 sm:text-base">
                            Enter the 6-digit code or scan the QR code to view shared content
                        </p>
                    </div>

                    {/* Code Input Card */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-lg sm:p-6 md:p-8">
                        {/* Tab Buttons */}
                        <div className="mb-6 flex gap-1.5 sm:gap-2 rounded-xl bg-slate-100 p-1.5">
                            <button
                                onClick={() => {
                                    setInputMode('code');
                                    setCode('');
                                    setNotFound(false);
                                }}
                                className={`flex-1 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold transition-all ${inputMode === 'code'
                                    ? 'bg-white text-blue-800 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
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
                                className={`flex-1 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold transition-all ${inputMode === 'link'
                                    ? 'bg-white text-blue-800 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Paste Link
                            </button>
                            <button
                                onClick={() => {
                                    setInputMode('qr');
                                    setShowScanner(true);
                                }}
                                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold transition-all ${inputMode === 'qr'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-blue-600 hover:bg-blue-50'
                                    }`}
                            >
                                <span>📷</span>
                                <span>Scan QR</span>
                            </button>
                        </div>

                        {/* Code Input Mode */}
                        {inputMode === 'code' && (
                            <>
                                <label className="mb-3 block text-sm font-semibold text-gray-700">
                                    Enter 6-Digit Code
                                </label>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                            setCode(value);
                                        }}
                                        onKeyDown={handleKeyPress}
                                        placeholder="123456"
                                        maxLength={6}
                                        className="flex-1 rounded-xl border-2 border-gray-200 p-3 text-center font-mono text-xl font-bold tracking-widest text-gray-800 focus:border-blue-500 focus:outline-none sm:p-4 sm:text-2xl"
                                    />
                                    <button
                                        onClick={() => handleReadCode()}
                                        disabled={loading || code.length !== 6}
                                        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-bold text-white transition-all hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8 sm:py-4"
                                    >
                                        {loading ? 'Loading...' : 'Read'}
                                    </button>
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                                    <span>💡 The code contains only numbers (6 digits)</span>
                                    <button
                                        type="button"
                                        onClick={() => setShowScanner(true)}
                                        className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                                    >
                                        <span>📷</span>
                                        <span>Or scan QR</span>
                                    </button>
                                </div>
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
                                            const match = link.match(/\/view\/(\d{6})/);
                                            setCode(match ? match[1] : '');
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && code.length === 6) {
                                                void handleReadCode();
                                            }
                                        }}
                                        className="flex-1 rounded-xl border-2 border-gray-200 p-3 text-sm text-gray-800 focus:border-purple-500 focus:outline-none sm:p-4 sm:text-base"
                                    />
                                    <button
                                        onClick={() => handleReadCode()}
                                        disabled={loading || code.length !== 6}
                                        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-bold text-white transition-all hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8 sm:py-4"
                                    >
                                        {loading ? 'Loading...' : 'Read'}
                                    </button>
                                </div>
                                <p className="mt-3 text-sm text-gray-500">
                                    💡 Paste the full shareable link and the code will be extracted automatically
                                </p>
                            </>
                        )}

                        {/* QR Scan Tab Mode (Click to open scanner) */}
                        {inputMode === 'qr' && (
                            <div className="py-6 text-center space-y-4">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
                                    📷
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">Scan QR Code from Sender</h3>
                                    <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                                        Point your mobile camera at the sender&apos;s QR code to view and download files without typing.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowScanner(true)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 active:scale-95"
                                >
                                    <span>📸 Open Mobile Camera Scanner</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Offline Saved Clips Section */}
                    {offlineClips.length > 0 && (
                        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-lg space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">💾</span>
                                    <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
                                        Saved Offline Shares ({offlineClips.length})
                                    </h3>
                                </div>
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                    ● Ready without internet
                                </span>
                            </div>

                            <p className="text-xs text-slate-500">
                                These clips are saved locally on this mobile device and can be viewed or downloaded anytime offline.
                            </p>

                            <div className="space-y-2 pt-1">
                                {offlineClips.map((saved) => (
                                    <div
                                        key={saved.code}
                                        onClick={() => {
                                            startNavigation();
                                            router.push(`/view/${saved.code}`);
                                        }}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50 p-3 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition-all"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex h-10 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 font-mono text-sm font-bold text-blue-900">
                                                {saved.code}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-800 truncate">
                                                    {saved.type === 'both' ? '📝 Text & 📎 Files' : saved.type === 'file' ? `📎 ${saved.files?.length || 1} Attached File(s)` : '📝 Text Snippet'}
                                                </p>
                                                <p className="text-[11px] text-slate-400">
                                                    Saved {new Date(saved.savedAt).toLocaleDateString()} · {new Date(saved.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    startNavigation();
                                                    router.push(`/view/${saved.code}`);
                                                }}
                                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 active:scale-95"
                                            >
                                                Open
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteOffline(saved.code, e)}
                                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-400 hover:text-red-600 hover:border-red-200 active:scale-95"
                                                title="Delete offline copy"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
                                Please check the code and try again. The content may have expired or was self-destructed.
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
                            <li>• Ask the sender for the 6-digit code or scan their QR code</li>
                            <li>• View the content instantly on your phone or computer</li>
                            <li>• Tap <b>&quot;Save for Offline&quot;</b> on the view page to keep and download data anytime without internet</li>
                            <li>• Content auto-expires according to the sender&apos;s lifespan</li>
                        </ul>
                    </div>
                </div>
            </main>

            {/* QR Camera Scanner Modal */}
            <QRScannerModal
                isOpen={showScanner}
                onClose={() => setShowScanner(false)}
                onScanSuccess={handleScanSuccess}
            />

            <Footer />
        </div>
    );
}
