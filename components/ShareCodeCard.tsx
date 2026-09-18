'use client';

import QRCode from 'react-qr-code';

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
}: ShareCodeCardProps) {
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/view/${code}` : `/view/${code}`;

    return (
        <div className="order-1 rounded-3xl border border-slate-100 bg-gradient-to-b from-white to-blue-50/40 p-6 text-center shadow-[0_20px_50px_rgba(2,6,23,0.10)] lg:order-2 lg:sticky lg:top-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-gray-400">Your code</p>

            {/* QR code */}
            <div className="mx-auto mt-4 w-fit rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                <QRCode
                    value={shareUrl}
                    size={132}
                    className="h-[132px] w-[132px]"
                />
            </div>

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
                ⏳ Expires in {expirationHours}h {hasDeletePin ? '· 🔐 PIN protected' : ''}
            </p>

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

            {onDestroy && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                    <button
                        onClick={onDestroy}
                        disabled={isDestroying}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/60 px-3.5 py-2.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-100/80 active:scale-95 disabled:opacity-50"
                    >
                        {isDestroying ? 'Wiping Share...' : '💥 Self-Destruct / Revoke Now'}
                    </button>
                    <p className="mt-1.5 text-[10px] text-slate-400">
                        Instantly deletes all files and text from server storage
                    </p>
                </div>
            )}
        </div>
    );
}
