'use client';

import { useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { showToast } from '@/lib/appEvents';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    code: string;
    url?: string;
}

export default function QRCodeModal({ isOpen, onClose, code, url }: QRCodeModalProps) {
    const qrContainerRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);
    const shareUrl = url || (typeof window !== 'undefined' ? `${window.location.origin}/view/${code}` : `/view/${code}`);

    if (!isOpen) return null;

    const handleDownloadQrPng = () => {
        if (!qrContainerRef.current) return;
        setDownloading(true);

        try {
            const svgElement = qrContainerRef.current.querySelector('svg');
            if (!svgElement) throw new Error('SVG not found');

            const svgString = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const URL = window.URL || window.webkitURL || window;
            const blobURL = URL.createObjectURL(svgBlob);

            const image = new Image();
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const size = 600; // High-res for saving to phone
                canvas.width = size;
                canvas.height = size;
                const context = canvas.getContext('2d');
                if (!context) return;

                // White background
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, size, size);
                context.drawImage(image, 40, 40, size - 80, size - 80);

                const pngUrl = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.download = `pasteport-qr-${code}.png`;
                downloadLink.href = pngUrl;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                URL.revokeObjectURL(blobURL);
                showToast('QR Code saved to device');
                setDownloading(false);
            };
            image.src = blobURL;
        } catch (err) {
            console.error('Failed to export QR code image:', err);
            showToast('Failed to save QR code');
            setDownloading(false);
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            showToast('Link copied to clipboard');
        } catch {
            showToast('Failed to copy link');
        }
    };

    const handleNativeShare = async () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title: 'Pasteport Share',
                    text: `Open this Pasteport share with code ${code}:`,
                    url: shareUrl,
                });
            } catch {
                // User cancelled share
            }
        } else {
            handleCopyLink();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-sm rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl text-center space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">📱</span>
                        <h3 className="font-bold text-slate-900">Mobile Share QR Code</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full bg-slate-100 p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                <p className="text-xs text-slate-500">
                    Scan with any mobile camera or QR reader to open instantly.
                </p>

                {/* Big High-Contrast QR Code */}
                <div
                    ref={qrContainerRef}
                    className="mx-auto w-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-md"
                >
                    <QRCode
                        value={shareUrl}
                        size={210}
                        className="h-[210px] w-[210px]"
                    />
                </div>

                {/* Code display */}
                <div className="flex items-center justify-center gap-1.5 font-mono text-xl font-black text-blue-900">
                    {code.split('').map((d, i) => (
                        <span
                            key={i}
                            className="flex h-10 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50"
                        >
                            {d}
                        </span>
                    ))}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                        onClick={handleDownloadQrPng}
                        disabled={downloading}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 active:scale-95 disabled:opacity-50"
                    >
                        <span>⬇</span>
                        <span>{downloading ? 'Saving...' : 'Save QR'}</span>
                    </button>
                    <button
                        onClick={handleNativeShare}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-blue-700 active:scale-95"
                    >
                        <span>🔗</span>
                        <span>Share Link</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
