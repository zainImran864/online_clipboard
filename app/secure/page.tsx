'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import {
    ACCESS_CODE_LENGTH,
    SEND_CODE_LENGTH,
    SECURE_MAX_FILE_SIZE,
    uploadSecureFile,
    fetchSecureDownload,
    type SecureDownloadResult,
} from '@/lib/secureShare';

function formatBytes(bytes: number) {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${bytes} B`;
}

export default function SecurePage() {
    const router = useRouter();
    const [mode, setMode] = useState<'upload' | 'download'>('upload');

    // Upload state
    const [accessCode, setAccessCode] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [sendCode, setSendCode] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Download state
    const [downloadCode, setDownloadCode] = useState('');
    const [downloading, setDownloading] = useState(false);
    const [downloadResult, setDownloadResult] = useState<SecureDownloadResult | null>(null);
    const [downloadError, setDownloadError] = useState<string | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0] ?? null;
        setUploadError(null);
        if (selected && selected.size > SECURE_MAX_FILE_SIZE) {
            setFile(null);
            setUploadError('File size must be 600MB or less');
            return;
        }
        setFile(selected);
    };

    const handleUpload = async () => {
        if (accessCode.length !== ACCESS_CODE_LENGTH || !file) return;
        setUploading(true);
        setUploadError(null);
        setProgress(0);

        try {
            const { sendCode: newSendCode } = await uploadSecureFile(accessCode, file, setProgress);
            setSendCode(newSendCode);
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async () => {
        if (downloadCode.length !== SEND_CODE_LENGTH) return;
        setDownloading(true);
        setDownloadError(null);
        setDownloadResult(null);

        try {
            const result = await fetchSecureDownload(downloadCode);
            setDownloadResult(result);
        } catch (err) {
            setDownloadError(err instanceof Error ? err.message : 'Code not found or expired');
        } finally {
            setDownloading(false);
        }
    };

    const copySendCode = () => {
        if (!sendCode) return;
        navigator.clipboard.writeText(sendCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const resetUpload = () => {
        setAccessCode('');
        setFile(null);
        setSendCode(null);
        setUploadError(null);
        setProgress(0);
    };

    return (
        <div className="min-h-screen bg-blue-50">
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

            <main className="flex min-h-[calc(100vh-100px)] items-center justify-center px-4 py-6 sm:min-h-[calc(100vh-120px)]">
                <div className="w-full max-w-2xl space-y-4 sm:space-y-6">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl md:text-4xl">Secret Share</h1>
                        <p className="mt-2 text-sm text-gray-600 sm:text-base">
                            Large files up to 600MB with a secret code · available for 6 hours
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4 shadow-lg sm:p-6 md:p-8">
                        {/* Tabs */}
                        <div className="mb-6 flex gap-2 rounded-lg bg-gray-100 p-1">
                            <button
                                onClick={() => setMode('upload')}
                                className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-all ${
                                    mode === 'upload' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                Upload with Secret Code
                            </button>
                            <button
                                onClick={() => setMode('download')}
                                className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-all ${
                                    mode === 'download' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                Download with Send Code
                            </button>
                        </div>

                        {/* Upload mode */}
                        {mode === 'upload' && !sendCode && (
                            <div className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        🔑 Secret Access Code (8 digits)
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={accessCode}
                                        onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, '').slice(0, ACCESS_CODE_LENGTH))}
                                        placeholder="12345678"
                                        maxLength={ACCESS_CODE_LENGTH}
                                        disabled={uploading}
                                        className="w-full rounded-lg border-2 border-gray-200 p-3 text-center font-mono text-xl font-bold tracking-widest text-gray-800 focus:border-blue-500 focus:outline-none disabled:opacity-60 sm:p-4 sm:text-2xl"
                                    />
                                    <p className="mt-2 text-xs text-gray-500">
                                        Ask the owner for a secret code. It works only once.
                                    </p>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        📎 File (up to 600MB)
                                    </label>
                                    <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-blue-400 hover:bg-blue-50">
                                        <input
                                            type="file"
                                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                            onChange={handleFileSelect}
                                            disabled={uploading}
                                        />
                                        {file ? (
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-gray-700">{file.name}</p>
                                                <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                                            </div>
                                        ) : (
                                            <>
                                                <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                <span className="text-sm text-gray-600">Click to choose a file</span>
                                            </>
                                        )}
                                    </label>
                                </div>

                                {uploading && (
                                    <div>
                                        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                                            <div
                                                className="h-full rounded-full bg-blue-600 transition-all"
                                                style={{ width: `${Math.round(progress * 100)}%` }}
                                            />
                                        </div>
                                        <p className="mt-2 text-center text-sm text-gray-600">
                                            Uploading… {Math.round(progress * 100)}%
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={handleUpload}
                                    disabled={uploading || accessCode.length !== ACCESS_CODE_LENGTH || !file}
                                    className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {uploading ? 'Uploading…' : 'Upload Securely'}
                                </button>

                                {uploadError && (
                                    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{uploadError}</div>
                                )}
                            </div>
                        )}

                        {/* Upload success */}
                        {mode === 'upload' && sendCode && (
                            <div className="space-y-5 text-center">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                    <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">File uploaded</h3>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Share this send code with the recipient. It works for 6 hours.
                                    </p>
                                </div>
                                <div className="rounded-xl bg-gray-50 p-6">
                                    <p className="font-mono text-3xl font-bold tracking-widest text-gray-800 sm:text-4xl">
                                        {sendCode}
                                    </p>
                                </div>
                                <button
                                    onClick={copySendCode}
                                    className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-700 active:scale-95"
                                >
                                    {copied ? '✓ Copied!' : 'Copy Send Code'}
                                </button>
                                <button
                                    onClick={resetUpload}
                                    className="w-full rounded-lg border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 active:scale-95"
                                >
                                    Upload Another
                                </button>
                            </div>
                        )}

                        {/* Download mode */}
                        {mode === 'download' && (
                            <div className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Enter 8-Digit Send Code
                                    </label>
                                    <div className="flex flex-col gap-3 sm:flex-row">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={downloadCode}
                                            onChange={(e) => {
                                                setDownloadCode(e.target.value.replace(/\D/g, '').slice(0, SEND_CODE_LENGTH));
                                                setDownloadError(null);
                                            }}
                                            onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
                                            placeholder="12345678"
                                            maxLength={SEND_CODE_LENGTH}
                                            className="flex-1 rounded-lg border-2 border-gray-200 p-3 text-center font-mono text-xl font-bold tracking-widest text-gray-800 focus:border-blue-500 focus:outline-none sm:p-4 sm:text-2xl"
                                        />
                                        <button
                                            onClick={handleDownload}
                                            disabled={downloading || downloadCode.length !== SEND_CODE_LENGTH}
                                            className="w-full rounded-lg bg-cyan-600 px-6 py-3 font-semibold text-white transition-all hover:bg-cyan-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
                                        >
                                            {downloading ? 'Loading…' : 'Get File'}
                                        </button>
                                    </div>
                                </div>

                                {downloadResult && (
                                    <div className="space-y-4 rounded-xl bg-gray-50 p-5">
                                        <div className="flex items-center gap-3">
                                            <svg className="h-10 w-10 flex-shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                                                <path d="M14 2v6h6" />
                                            </svg>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-semibold text-gray-800">{downloadResult.fileName}</p>
                                                <p className="text-xs text-gray-500">{formatBytes(downloadResult.fileSize)}</p>
                                            </div>
                                        </div>
                                        <a
                                            href={downloadResult.url}
                                            className="block w-full rounded-lg bg-blue-600 px-6 py-3 text-center font-semibold text-white transition-all hover:bg-blue-700 active:scale-95"
                                        >
                                            Download File
                                        </a>
                                    </div>
                                )}

                                {downloadError && (
                                    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{downloadError}</div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="rounded-lg bg-blue-50 p-6">
                        <h3 className="mb-2 font-semibold text-blue-900">How it works:</h3>
                        <ul className="space-y-1 text-sm text-blue-800">
                            <li>• A secret code is required to upload — it works only once</li>
                            <li>• Files can be up to 600MB and stay available for 6 hours</li>
                            <li>• After uploading, share the generated send code to let others download</li>
                            <li>• Files are permanently deleted after 6 hours</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
