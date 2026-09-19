'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';
import QRCodeModal from '@/components/QRCodeModal';

interface ShareCodeCardProps {
    code: string;
    copiedCode: boolean;
    copiedLink: boolean;
    onCopyCode: () => void;
    onCopyLink: (url: string) => void;
    onShare: (url: string, code: string) => void;
    expirationHours?: number;
    hasDeletePin?: boolean;
    onDestroy?: () => void;
    isDestroying?: boolean;
    hasAccessPin?: boolean;
    onToggleAccessPin?: (enabled: boolean, pin?: string) => Promise<void>;
    isUpdatingPin?: boolean;
}

export default function ShareCodeCard({
    code,
    copiedCode,
    copiedLink,
    onCopyCode,
    onCopyLink,
    onShare,
    expirationHours = 24,
    hasDeletePin = false,
    onDestroy,
    isDestroying = false,
    hasAccessPin = false,
    onToggleAccessPin,
    isUpdatingPin = false,
}: ShareCodeCardProps) {
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/view/${code}` : `/view/${code}`;

    const [showPinModal, setShowPinModal] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState<string | null>(null);

    const handleOpenSetPin = () => {
        setPinInput('');
        setPinError(null);
        setShowPinModal(true);
    };

    const handleToggleClick = async () => {
        if (!onToggleAccessPin || isUpdatingPin) return;

        if (hasAccessPin) {
            // Turning OFF
            await onToggleAccessPin(false);
        } else {
            // Turning ON - open modal to set 4-character PIN
            handleOpenSetPin();
        }
    };

    const handleSavePin = async () => {
        if (!onToggleAccessPin) return;

        const trimmed = pinInput.trim();
        if (trimmed.length !== 4) {
            setPinError('PIN must be exactly 4 characters.');
            return;
        }

        try {
            setPinError(null);
            await onToggleAccessPin(true, trimmed);
            setShowPinModal(false);
        } catch (err) {
            setPinError(err instanceof Error ? err.message : 'Failed to update PIN');
        }
    };

    const [showQrModal, setShowQrModal] = useState(false);

    return (
        <div className="order-1 rounded-3xl border border-slate-100 bg-gradient-to-b from-white to-blue-50/40 p-6 text-center shadow-[0_20px_50px_rgba(2,6,23,0.10)] lg:order-2 lg:sticky lg:top-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-gray-400">Your code</p>

            {/* QR code with enlarge on click */}
            <div
                onClick={() => setShowQrModal(true)}
                className="group relative mx-auto mt-4 w-fit cursor-pointer rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-blue-300 hover:shadow-md active:scale-95"
                title="Tap to enlarge QR code or save image"
            >
                <QRCode
                    value={shareUrl}
                    size={132}
                    className="h-[132px] w-[132px]"
                />
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-blue-900/0 opacity-0 transition-all group-hover:bg-blue-900/20 group-hover:opacity-100">
                    <span className="rounded-full bg-slate-900/80 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-xs">
                        🔍 Enlarge
                    </span>
                </div>
            </div>
            <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="mt-1 text-[11px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
            >
                <span>📱 Scan / Save QR Code</span>
            </button>

            {/* Fullscreen QR Modal */}
            <QRCodeModal
                isOpen={showQrModal}
                onClose={() => setShowQrModal(false)}
                code={code}
                url={shareUrl}
            />

            {/* Code digits + copy — wraps instead of overflowing the card */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                {code.split('').map((d, i) => (
                    <div key={i} className="flex h-12 w-9 items-center justify-center rounded-xl border border-indigo-200 bg-gradient-to-b from-indigo-50 to-indigo-100 font-mono text-xl font-extrabold text-indigo-800 sm:h-14 sm:w-11 sm:text-2xl">
                        {d}
                    </div>
                ))}
                <button
                    onClick={onCopyCode}
                    title="Copy code"
                    className="flex h-12 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-base text-white transition-all hover:bg-blue-700 active:scale-95 sm:h-14 sm:w-11 sm:text-lg"
                >
                    {copiedCode ? '✓' : '📋'}
                </button>
            </div>

            <p className="mt-3 text-xs text-gray-500 font-medium">
                ⏳ Expires in {expirationHours}h {hasDeletePin ? '· 💥 Self-Destruct enabled' : ''}
            </p>

            {/* Self-Destruct button right below the generated code */}
            {onDestroy && (
                <div className="mt-3">
                    <button
                        onClick={onDestroy}
                        disabled={isDestroying}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/80 px-3.5 py-2.5 text-xs font-bold text-red-600 shadow-xs transition-all hover:bg-red-100 active:scale-95 disabled:opacity-50"
                    >
                        <span>💥</span>
                        <span>{isDestroying ? 'Wiping Share...' : 'Self-Destruct Share Now'}</span>
                    </button>
                    <p className="mt-1 text-[11px] text-slate-400">
                        {hasDeletePin ? 'Requires your configured PIN to wipe' : 'Permanently wipe and destroy this share'}
                    </p>
                </div>
            )}

            {/* Runtime 4-Character Access PIN Section */}
            <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs text-left">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-base">{hasAccessPin ? '🔐' : '🔓'}</span>
                        <div>
                            <p className="text-xs font-bold text-slate-800">
                                {hasAccessPin ? 'PIN Protected' : 'No Access PIN'}
                            </p>
                            <p className="text-[11px] text-slate-500">
                                {hasAccessPin ? '4-character PIN required to view' : 'Public to anyone with code'}
                            </p>
                        </div>
                    </div>

                    {onToggleAccessPin && (
                        <button
                            type="button"
                            onClick={handleToggleClick}
                            disabled={isUpdatingPin}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${hasAccessPin ? 'bg-blue-600' : 'bg-slate-300'
                                }`}
                            role="switch"
                            aria-checked={hasAccessPin}
                            aria-label="Toggle runtime 4-character PIN protection"
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${hasAccessPin ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    )}
                </div>

                {hasAccessPin && onToggleAccessPin && (
                    <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                        <span className="text-emerald-700 font-semibold">● Active on Reader screens</span>
                        <button
                            type="button"
                            onClick={handleOpenSetPin}
                            disabled={isUpdatingPin}
                            className="font-bold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            Edit PIN
                        </button>
                    </div>
                )}
            </div>

            {/* Modal for setting runtime Access PIN */}
            {showPinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-fadeIn text-left">
                    <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <span>🔐</span>
                                <span>{hasAccessPin ? 'Update 4-Character PIN' : 'Set 4-Character Access PIN'}</span>
                            </h3>
                            <button
                                onClick={() => setShowPinModal(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                            Enter a 4-character PIN. Readers currently viewing this share will be instantly locked in real-time until they enter this PIN.
                        </p>

                        <div>
                            <input
                                type="text"
                                maxLength={4}
                                value={pinInput}
                                onChange={(e) => setPinInput(e.target.value.slice(0, 4))}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && pinInput.trim().length === 4) {
                                        void handleSavePin();
                                    }
                                }}
                                placeholder="4 letters/digits (e.g. ABCD or 7421)"
                                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-center text-lg font-mono font-bold tracking-widest text-slate-900 focus:border-blue-500 focus:outline-none"
                                autoFocus
                            />
                            <p className="mt-1 text-[11px] text-slate-400 text-center">
                                Exactly 4 characters required
                            </p>
                        </div>

                        {pinError && (
                            <p className="text-xs font-semibold text-red-600">{pinError}</p>
                        )}

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setShowPinModal(false)}
                                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSavePin}
                                disabled={isUpdatingPin || pinInput.trim().length !== 4}
                                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                            >
                                {isUpdatingPin ? 'Saving...' : 'Lock with PIN'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Divider */}
            <div className="my-5 flex items-center gap-3 text-[11px] font-bold text-gray-300">
                <span className="h-px flex-1 bg-gray-200" /> OR SHARE LINK <span className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Link + copy */}
            <div className="flex gap-2">
                <div className="min-w-0 flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-xs text-gray-600">
                    {shareUrl}
                </div>
                <button
                    onClick={() => onCopyLink(shareUrl)}
                    className="flex-shrink-0 rounded-xl border border-indigo-100 bg-indigo-50 px-4 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
                >
                    {copiedLink ? '✓ Copied' : '📋 Copy'}
                </button>
            </div>

            {/* Share */}
            <button
                onClick={() => onShare(shareUrl, code)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-500/30 transition-all hover:brightness-105 active:scale-95"
            >
                🔗 Share
            </button>
        </div>
    );
}
