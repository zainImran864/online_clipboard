'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { showToast } from '@/lib/appEvents';
import { md5, computeWebCryptoHash, computeHmac, bufferToHex, bufferToBase64 } from '@/lib/cryptoHelpers';

interface HashResult {
    algo: string;
    hash: string;
}

export default function HashGeneratorPage() {
    const router = useRouter();
    const [mode, setMode] = useState<'text' | 'file'>('text');
    const [textInput, setTextInput] = useState<string>('Hello Pasteport');
    const [secretKey, setSecretKey] = useState<string>('');
    const [isHmac, setIsHmac] = useState<boolean>(false);
    const [format, setFormat] = useState<'lower' | 'upper' | 'base64'>('lower');
    const [verifyHash, setVerifyHash] = useState<string>('');

    // File mode state
    const [fileName, setFileName] = useState<string | null>(null);
    const [fileSize, setFileSize] = useState<number>(0);
    const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);

    const [results, setResults] = useState<HashResult[]>([]);

    useEffect(() => {
        let isMounted = true;

        const runComputation = async () => {
            try {
                const list: HashResult[] = [];
                const dataToHash = mode === 'text' ? textInput : fileBuffer;

                if (dataToHash === null) {
                    if (isMounted) setResults([]);
                    return;
                }

                if (isHmac && secretKey.trim() && mode === 'text') {
                    // HMAC Mode
                    const hmac256 = await computeHmac('SHA-256', secretKey, textInput);
                    const hmac512 = await computeHmac('SHA-512', secretKey, textInput);

                    let val256 = bufferToHex(hmac256);
                    let val512 = bufferToHex(hmac512);

                    if (format === 'upper') {
                        val256 = val256.toUpperCase();
                        val512 = val512.toUpperCase();
                    } else if (format === 'base64') {
                        val256 = bufferToBase64(hmac256);
                        val512 = bufferToBase64(hmac512);
                    }

                    list.push({ algo: 'HMAC-SHA256', hash: val256 });
                    list.push({ algo: 'HMAC-SHA512', hash: val512 });
                } else {
                    // Standard Hashes
                    // MD5
                    if (mode === 'text') {
                        let md5Val = md5(textInput);
                        if (format === 'upper') md5Val = md5Val.toUpperCase();
                        list.push({ algo: 'MD5', hash: md5Val });
                    }

                    // SHA-1
                    const sha1Buf = await computeWebCryptoHash('SHA-1', dataToHash);
                    let sha1Val = format === 'base64' ? bufferToBase64(sha1Buf) : bufferToHex(sha1Buf);
                    if (format === 'upper') sha1Val = sha1Val.toUpperCase();
                    list.push({ algo: 'SHA-1', hash: sha1Val });

                    // SHA-256
                    const sha256Buf = await computeWebCryptoHash('SHA-256', dataToHash);
                    let sha256Val = format === 'base64' ? bufferToBase64(sha256Buf) : bufferToHex(sha256Buf);
                    if (format === 'upper') sha256Val = sha256Val.toUpperCase();
                    list.push({ algo: 'SHA-256', hash: sha256Val });

                    // SHA-384
                    const sha384Buf = await computeWebCryptoHash('SHA-384', dataToHash);
                    let sha384Val = format === 'base64' ? bufferToBase64(sha384Buf) : bufferToHex(sha384Buf);
                    if (format === 'upper') sha384Val = sha384Val.toUpperCase();
                    list.push({ algo: 'SHA-384', hash: sha384Val });

                    // SHA-512
                    const sha512Buf = await computeWebCryptoHash('SHA-512', dataToHash);
                    let sha512Val = format === 'base64' ? bufferToBase64(sha512Buf) : bufferToHex(sha512Buf);
                    if (format === 'upper') sha512Val = sha512Val.toUpperCase();
                    list.push({ algo: 'SHA-512', hash: sha512Val });
                }

                if (isMounted) {
                    setResults(list);
                }
            } catch {
                if (isMounted) {
                    setResults([]);
                }
            }
        };

        void runComputation();

        return () => {
            isMounted = false;
        };
    }, [mode, textInput, fileBuffer, isHmac, secretKey, format]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setFileSize(file.size);

        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
                setFileBuffer(reader.result);
                showToast(`Loaded ${file.name}`);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const copyHash = async (hash: string, algo: string) => {
        await navigator.clipboard.writeText(hash);
        showToast(`Copied ${algo} hash`);
    };

    const shareViaPasteport = () => {
        if (!results.length) return;
        const summary = `Cryptographic Hashes:\nTarget: ${mode === 'text' ? `Text ("${textInput}")` : `File (${fileName}, ${fileSize} bytes)`}\n\n${results.map((r) => `${r.algo}:\n${r.hash}`).join('\n\n')}`;
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pasteport_prefill_text', summary);
            router.push('/send');
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Navbar />

            <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
                <div className="mx-auto max-w-5xl space-y-6">
                    {/* Header */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                                🔐 Web Crypto Hash Engine
                            </div>
                            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                                Cryptographic Hash & Checksum Generator
                            </h1>
                            <p className="text-xs text-slate-500 sm:text-sm">
                                Compute MD5, SHA-1, SHA-256, SHA-512, and HMAC signatures client-side in browser memory.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={shareViaPasteport}
                                disabled={!results.length}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
                            >
                                🚀 Share via Pasteport
                            </button>
                        </div>
                    </div>

                    {/* Mode & Config Controls */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50">
                                <button
                                    onClick={() => setMode('text')}
                                    className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                                        mode === 'text'
                                            ? 'bg-white text-blue-700 shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    📝 Text Input
                                </button>
                                <button
                                    onClick={() => setMode('file')}
                                    className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                                        mode === 'file'
                                            ? 'bg-white text-blue-700 shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    📁 File Checksum
                                </button>
                            </div>

                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                <span>Format:</span>
                                <select
                                    value={format}
                                    onChange={(e) => setFormat(e.target.value as 'lower' | 'upper' | 'base64')}
                                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold focus:outline-none"
                                >
                                    <option value="lower">Lowercase Hex</option>
                                    <option value="upper">Uppercase Hex</option>
                                    <option value="base64">Base64</option>
                                </select>
                            </div>
                        </div>

                        {/* Text Mode Input */}
                        {mode === 'text' && (
                            <div className="space-y-3">
                                <textarea
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder="Type or paste text to hash..."
                                    rows={3}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none sm:text-sm"
                                />

                                <div className="flex flex-wrap items-center gap-3 pt-1">
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isHmac}
                                            onChange={(e) => setIsHmac(e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        HMAC Mode (Keyed Hash)
                                    </label>

                                    {isHmac && (
                                        <input
                                            type="text"
                                            value={secretKey}
                                            onChange={(e) => setSecretKey(e.target.value)}
                                            placeholder="Enter secret key..."
                                            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-mono focus:bg-white focus:outline-none"
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* File Mode Input */}
                        {mode === 'file' && (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                                <input
                                    type="file"
                                    id="fileHashInput"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="fileHashInput"
                                    className="cursor-pointer inline-flex flex-col items-center"
                                >
                                    <span className="text-3xl mb-2">📁</span>
                                    <span className="text-xs font-bold text-blue-600 hover:underline">
                                        Choose a file or drop it here
                                    </span>
                                    <span className="text-[11px] text-slate-400 mt-1">
                                        Files are hashed 100% locally in your browser memory.
                                    </span>
                                </label>
                                {fileName && (
                                    <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-1 text-xs font-mono font-bold text-slate-700">
                                        📄 {fileName} ({Math.round(fileSize / 1024)} KB)
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Verify / Compare Hash Bar */}
                        <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                            <span className="font-bold text-slate-500 whitespace-nowrap">Verify Hash:</span>
                            <input
                                type="text"
                                value={verifyHash}
                                onChange={(e) => setVerifyHash(e.target.value.trim())}
                                placeholder="Paste expected hash to compare..."
                                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs focus:bg-white focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Generated Hashes
                        </span>

                        <div className="space-y-2.5">
                            {results.map((item) => {
                                const isMatch =
                                    verifyHash &&
                                    item.hash.toLowerCase() === verifyHash.toLowerCase();

                                return (
                                    <div
                                        key={item.algo}
                                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border p-3 transition-colors ${
                                            isMatch
                                                ? 'border-emerald-300 bg-emerald-50/50'
                                                : 'border-slate-200 bg-slate-50 hover:bg-white'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-[120px]">
                                            <span className="font-bold text-xs text-blue-700">
                                                {item.algo}
                                            </span>
                                            {isMatch && (
                                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                                    Match ✓
                                                </span>
                                            )}
                                        </div>

                                        <span className="flex-1 font-mono text-xs font-bold text-slate-800 break-all select-all">
                                            {item.hash}
                                        </span>

                                        <button
                                            onClick={() => copyHash(item.hash, item.algo)}
                                            className="self-end sm:self-auto rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
