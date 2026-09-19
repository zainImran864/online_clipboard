'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { showToast } from '@/lib/appEvents';

interface QRScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScanSuccess: (code: string) => void;
}

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }: QRScannerModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [processingPhoto, setProcessingPhoto] = useState(false);
    const animationFrameId = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Extract 6-digit code from URL or text
    const extractCode = useCallback((raw: string): string | null => {
        const trimmed = raw.trim();
        // Check if full URL
        const urlMatch = trimmed.match(/\/view\/(\d{6})/);
        if (urlMatch) return urlMatch[1];

        // Check if 6-digit code
        const codeMatch = trimmed.match(/\b\d{6}\b/);
        if (codeMatch) return codeMatch[0];

        return null;
    }, []);

    const handleFoundCode = useCallback((code: string) => {
        try {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(100);
            }
        } catch {
            // Ignore
        }
        showToast(`QR Code scanned: ${code}`);
        onScanSuccess(code);
    }, [onScanSuccess]);

    // Start video camera and scan loop
    useEffect(() => {
        if (!isOpen) return;

        // Check for mediaDevices
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            const timer = setTimeout(() => {
                setErrorMessage('Camera access is not supported in this browser. You can upload an image of the QR code instead.');
            }, 0);
            return () => clearTimeout(timer);
        }

        let isSubscribed = true;

        const scanFrame = () => {
            if (!isSubscribed) return;

            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (video && canvas && video.readyState >= 2) {
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: 'dontInvert',
                    });

                    if (qrCode && qrCode.data) {
                        const detectedCode = extractCode(qrCode.data);
                        if (detectedCode) {
                            handleFoundCode(detectedCode);
                            return;
                        }
                    }
                }
            }

            animationFrameId.current = requestAnimationFrame(scanFrame);
        };

        navigator.mediaDevices
            .getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            })
            .then((stream) => {
                if (!isSubscribed) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.setAttribute('playsinline', 'true');
                    void videoRef.current.play();
                }
                setCameraActive(true);
                animationFrameId.current = requestAnimationFrame(scanFrame);
            })
            .catch((err) => {
                console.warn('[QRScanner] Camera access denied or unavailable:', err);
                if (isSubscribed) {
                    setErrorMessage('Camera permission was denied or camera is unavailable. You can upload an image of the QR code below.');
                }
            });

        return () => {
            isSubscribed = false;
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
            setCameraActive(false);
        };
    }, [isOpen, extractCode, handleFoundCode]);

    // Process photo or gallery upload
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setProcessingPhoto(true);
        setErrorMessage(null);

        try {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            await new Promise((res, rej) => {
                img.onload = res;
                img.onerror = rej;
            });

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not create canvas context');

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qr = jsQR(imageData.data, imageData.width, imageData.height);

            if (qr && qr.data) {
                const detectedCode = extractCode(qr.data);
                if (detectedCode) {
                    handleFoundCode(detectedCode);
                    return;
                }
                setErrorMessage(`Found QR code, but it is not a valid 6-digit Pasteport share: ${qr.data.slice(0, 30)}...`);
            } else {
                setErrorMessage('No QR code detected in this photo. Please try a clearer picture.');
            }
        } catch (err) {
            console.error('[QRScanner] Error reading uploaded image:', err);
            setErrorMessage('Failed to process image. Please try again.');
        } finally {
            setProcessingPhoto(false);
            if (e.target) e.target.value = '';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn">
            <div className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 text-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">📷</span>
                        <h3 className="font-bold text-slate-100">Scan Share QR Code</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full bg-slate-800 p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                        aria-label="Close scanner"
                    >
                        ✕
                    </button>
                </div>

                {/* Viewfinder / Camera Area */}
                <div className="relative flex h-72 w-full items-center justify-center overflow-hidden bg-black">
                    <video
                        ref={videoRef}
                        className="h-full w-full object-cover"
                        playsInline
                        muted
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Viewfinder overlay */}
                    {cameraActive && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            {/* Scanning box */}
                            <div className="relative h-48 w-48 rounded-2xl border-2 border-blue-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                                {/* Animated scan line */}
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#38bdf8] animate-pulse" style={{
                                    animation: 'scanLine 2s infinite ease-in-out'
                                }} />
                                {/* Corners */}
                                <div className="absolute -top-1 -left-1 h-4 w-4 border-t-4 border-l-4 border-cyan-400 rounded-tl-sm" />
                                <div className="absolute -top-1 -right-1 h-4 w-4 border-t-4 border-r-4 border-cyan-400 rounded-tr-sm" />
                                <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-4 border-l-4 border-cyan-400 rounded-bl-sm" />
                                <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-4 border-r-4 border-cyan-400 rounded-br-sm" />
                            </div>
                        </div>
                    )}

                    {/* Loading / Error state */}
                    {!cameraActive && !errorMessage && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mb-3" />
                            <p className="text-xs text-slate-300">Requesting camera access...</p>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 p-6 text-center">
                            <span className="text-3xl mb-2">📸</span>
                            <p className="text-xs font-semibold text-amber-300 leading-relaxed">
                                {errorMessage}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="space-y-3 p-5">
                    <p className="text-center text-xs text-slate-400">
                        Point your camera at the QR code on the sender&apos;s screen to open instantly.
                    </p>

                    <div className="flex items-center gap-2">
                        <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 transition-colors hover:bg-slate-700">
                            <span>🖼️</span>
                            <span>{processingPhoto ? 'Processing...' : 'Upload/Snap Photo'}</span>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handlePhotoUpload}
                                disabled={processingPhoto}
                                className="hidden"
                            />
                        </label>
                        <button
                            onClick={onClose}
                            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-700"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes scanLine {
                    0% { top: 0%; opacity: 0.8; }
                    50% { top: 96%; opacity: 1; }
                    100% { top: 0%; opacity: 0.8; }
                }
            `}</style>
        </div>
    );
}
