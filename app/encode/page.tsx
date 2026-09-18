'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { showToast } from '@/lib/appEvents';

export default function EncodeDecodePage() {
    const router = useRouter();
    const [tab, setTab] = useState<'base64' | 'url' | 'file'>('base64');

    // Text Base64 State
    const [b64Input, setB64Input] = useState('Hello from Pasteport! Share anything instantly.');
    const [b64Output, setB64Output] = useState(() => {
        try {
            return btoa('Hello from Pasteport! Share anything instantly.');
        } catch {
            return '';
        }
    });
    const [b64Mode, setB64Mode] = useState<'encode' | 'decode'>('encode');

    // URL State
    const [urlInput, setUrlInput] = useState('https://pasteport.app/view/984210?param=hello world & live=true');
    const [urlOutput, setUrlOutput] = useState(() => encodeURIComponent('https://pasteport.app/view/984210?param=hello world & live=true'));
    const [urlMode, setUrlMode] = useState<'encode' | 'decode'>('encode');

    // File State
    const [fileDataUri, setFileDataUri] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [fileSize, setFileSize] = useState<number | null>(null);
    const [isImage, setIsImage] = useState<boolean>(false);

    const handleB64Transform = (val: string, mode: 'encode' | 'decode') => {
        setB64Input(val);
        setB64Mode(mode);
        try {
            if (mode === 'encode') {
                const encoded = btoa(unescape(encodeURIComponent(val)));
                setB64Output(encoded);
            } else {
                const decoded = decodeURIComponent(escape(atob(val.trim())));
                setB64Output(decoded);
            }
        } catch {
            setB64Output('Error: Unable to convert string.');
        }
    };

    const handleUrlTransform = (val: string, mode: 'encode' | 'decode') => {
        setUrlInput(val);
        setUrlMode(mode);
        try {
            if (mode === 'encode') {
                setUrlOutput(encodeURIComponent(val));
            } else {
                setUrlOutput(decodeURIComponent(val));
            }
        } catch {
            setUrlOutput('Error: Malformed URI sequence.');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setFileSize(file.size);
        setIsImage(file.type.startsWith('image/'));

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            setFileDataUri(result);
            showToast(`Converted ${file.name} to Data URI`);
        };
        reader.readAsDataURL(file);
    };

    const copyText = async (text: string, label = 'Copied') => {
        await navigator.clipboard.writeText(text);
        showToast(label);
    };

    const shareOutputViaPasteport = (content: string) => {
        if (!content) return;
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pasteport_prefill_text', content);
            router.push('/send');
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Navbar />

            <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
                <div className="mx-auto max-w-5xl space-y-6">
                    {/* Header */}
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                            🔄 Developer Utility
                        </div>
                        <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                            Base64 & URL Encoder / Decoder
                        </h1>
                        <p className="text-xs text-slate-500 sm:text-sm">
                            Convert strings, URL queries, tokens, and binary files to Base64 and Data URIs instantly in the browser.
                        </p>
                    </div>

                    {/* Mode Tabs */}
                    <div className="flex rounded-2xl bg-slate-200/80 p-1.5 sm:w-fit">
                        <button
                            onClick={() => setTab('base64')}
                            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all sm:text-sm ${
                                tab === 'base64' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                            }`}
                        >
                            🔤 Text Base64
                        </button>
                        <button
                            onClick={() => setTab('url')}
                            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all sm:text-sm ${
                                tab === 'url' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                            }`}
                        >
                            🔗 URL Encode
                        </button>
                        <button
                            onClick={() => setTab('file')}
                            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all sm:text-sm ${
                                tab === 'file' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                            }`}
                        >
                            🖼️ File to Base64
                        </button>
                    </div>

                    {/* Base64 Tab */}
                    {tab === 'base64' && (
                        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleB64Transform(b64Input, 'encode')}
                                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                            b64Mode === 'encode' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        Encode to Base64
                                    </button>
                                    <button
                                        onClick={() => handleB64Transform(b64Input, 'decode')}
                                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                            b64Mode === 'decode' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        Decode from Base64
                                    </button>
                                </div>
                                <button
                                    onClick={() => shareOutputViaPasteport(b64Output)}
                                    className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs"
                                >
                                    🚀 Share Output
                                </button>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                                <div className="space-y-1.5">
                                    <span className="text-xs font-bold text-slate-700">Input String</span>
                                    <textarea
                                        value={b64Input}
                                        onChange={(e) => handleB64Transform(e.target.value, b64Mode)}
                                        className="h-48 w-full rounded-2xl border-2 border-slate-200 p-3 font-mono text-xs focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                        <span>Output ({b64Mode === 'encode' ? 'Base64' : 'Plain Text'})</span>
                                        <button
                                            onClick={() => copyText(b64Output, 'Base64 output copied')}
                                            className="text-blue-600 hover:underline"
                                        >
                                            📋 Copy
                                        </button>
                                    </div>
                                    <textarea
                                        value={b64Output}
                                        readOnly
                                        className="h-48 w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 p-3 font-mono text-xs text-slate-800 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* URL Tab */}
                    {tab === 'url' && (
                        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleUrlTransform(urlInput, 'encode')}
                                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                            urlMode === 'encode' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        URL Encode (Percent-Encoding)
                                    </button>
                                    <button
                                        onClick={() => handleUrlTransform(urlInput, 'decode')}
                                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                            urlMode === 'decode' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        URL Decode
                                    </button>
                                </div>
                                <button
                                    onClick={() => shareOutputViaPasteport(urlOutput)}
                                    className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs"
                                >
                                    🚀 Share Output
                                </button>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                                <div className="space-y-1.5">
                                    <span className="text-xs font-bold text-slate-700">Input URL / Query</span>
                                    <textarea
                                        value={urlInput}
                                        onChange={(e) => handleUrlTransform(e.target.value, urlMode)}
                                        className="h-48 w-full rounded-2xl border-2 border-slate-200 p-3 font-mono text-xs focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                        <span>Output Result</span>
                                        <button
                                            onClick={() => copyText(urlOutput, 'URL output copied')}
                                            className="text-blue-600 hover:underline"
                                        >
                                            📋 Copy
                                        </button>
                                    </div>
                                    <textarea
                                        value={urlOutput}
                                        readOnly
                                        className="h-48 w-full rounded-2xl border-2 border-slate-200 bg-slate-50/50 p-3 font-mono text-xs text-slate-800 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* File to Base64 Tab */}
                    {tab === 'file' && (
                        <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center hover:border-blue-400">
                                <input
                                    type="file"
                                    onChange={handleFileUpload}
                                    id="file-upload-input"
                                    className="hidden"
                                />
                                <label htmlFor="file-upload-input" className="cursor-pointer space-y-2 block">
                                    <span className="text-3xl block">📁</span>
                                    <span className="text-sm font-bold text-blue-600 hover:underline block">
                                        Choose any file or image to convert to Base64
                                    </span>
                                    <span className="text-xs text-slate-400 block">
                                        Converted locally in browser memory into standard Data URI
                                    </span>
                                </label>
                            </div>

                            {fileDataUri && (
                                <div className="space-y-4 animate-fadeIn">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">{fileName}</p>
                                            <p className="text-[11px] text-slate-400">
                                                Size: {(fileSize! / 1024).toFixed(1)} KB · Base64: {fileDataUri.length} chars
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => copyText(fileDataUri, 'Data URI copied to clipboard')}
                                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                                            >
                                                📋 Copy Data URI
                                            </button>
                                            <button
                                                onClick={() => shareOutputViaPasteport(fileDataUri)}
                                                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs"
                                            >
                                                🚀 Share Data URI
                                            </button>
                                        </div>
                                    </div>

                                    {isImage && (
                                        <div className="flex justify-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={fileDataUri}
                                                alt="Preview"
                                                className="max-h-48 rounded-xl object-contain shadow-xs"
                                            />
                                        </div>
                                    )}

                                    <textarea
                                        value={fileDataUri}
                                        readOnly
                                        className="h-36 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-slate-700 focus:outline-none"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
