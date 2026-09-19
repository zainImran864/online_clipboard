'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { showToast } from '@/lib/appEvents';

type UuidVersion = 'v4' | 'v7' | 'guid';

function generateV4(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function generateV7(): string {
    const timestamp = BigInt(Date.now());
    const randomBytes = new Uint8Array(10);
    if (typeof crypto !== 'undefined') {
        crypto.getRandomValues(randomBytes);
    } else {
        for (let i = 0; i < 10; i++) randomBytes[i] = (Math.random() * 256) | 0;
    }

    const timeHex = timestamp.toString(16).padStart(12, '0');
    const randHex = Array.from(randomBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    const part1 = timeHex.slice(0, 8);
    const part2 = timeHex.slice(8, 12);
    const part3 = '7' + randHex.slice(0, 3);
    const varBits = ((randomBytes[2] & 0x3f) | 0x80).toString(16).padStart(2, '0');
    const part4 = varBits + randHex.slice(4, 6);
    const part5 = randHex.slice(6, 18);

    return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}

function makeUuidList(
    c: number,
    v: UuidVersion,
    upper: boolean,
    hyph: boolean,
    brc: boolean
): string[] {
    const list: string[] = [];
    for (let i = 0; i < c; i++) {
        let base = v === 'v7' ? generateV7() : generateV4();
        if (!hyph) {
            base = base.replace(/-/g, '');
        }
        if (upper || v === 'guid') {
            base = base.toUpperCase();
        } else {
            base = base.toLowerCase();
        }
        if (brc || v === 'guid') {
            base = `{${base}}`;
        }
        list.push(base);
    }
    return list;
}

export default function UuidGeneratorPage() {
    const router = useRouter();
    const [version, setVersion] = useState<UuidVersion>('v4');
    const [count, setCount] = useState<number>(5);
    const [uppercase, setUppercase] = useState<boolean>(false);
    const [hyphens, setHyphens] = useState<boolean>(true);
    const [braces, setBraces] = useState<boolean>(false);
    const [format, setFormat] = useState<'lines' | 'comma' | 'json'>('lines');
    const [uuids, setUuids] = useState<string[]>(() => makeUuidList(5, 'v4', false, true, false));

    const generateBatch = (
        v = version,
        c = count,
        u = uppercase,
        h = hyphens,
        b = braces
    ) => {
        setUuids(makeUuidList(c, v, u, h, b));
    };

    const formattedOutput = useCallback(() => {
        if (format === 'json') {
            return JSON.stringify(uuids, null, 2);
        }
        if (format === 'comma') {
            return uuids.join(', ');
        }
        return uuids.join('\n');
    }, [uuids, format]);

    const copyAll = async () => {
        const text = formattedOutput();
        await navigator.clipboard.writeText(text);
        showToast(`Copied ${uuids.length} UUIDs to clipboard`);
    };

    const copySingle = async (uuid: string) => {
        await navigator.clipboard.writeText(uuid);
        showToast('UUID copied');
    };

    const shareViaPasteport = () => {
        const text = formattedOutput();
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pasteport_prefill_text', text);
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
                            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                                🎲 Cryptographically Secure
                            </div>
                            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                                UUID & GUID Generator
                            </h1>
                            <p className="text-xs text-slate-500 sm:text-sm">
                                Generate RFC 4122 (v4 random) and RFC 9562 (v7 time-ordered) UUIDs instantly in your browser.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => generateBatch()}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95"
                            >
                                🔄 Regenerate
                            </button>
                            <button
                                onClick={copyAll}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 shadow-xs hover:bg-blue-100 active:scale-95"
                            >
                                📋 Copy All
                            </button>
                            <button
                                onClick={shareViaPasteport}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95"
                            >
                                🚀 Share via Pasteport
                            </button>
                        </div>
                    </div>

                    {/* Controls Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
                        {/* Row 1: Version and Count */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    UUID Standard
                                </label>
                                <div className="mt-2 flex rounded-xl border border-slate-200 p-1 bg-slate-50">
                                    {[
                                        { id: 'v4', label: 'UUID v4 (Random)' },
                                        { id: 'v7', label: 'UUID v7 (Time-Ordered)' },
                                        { id: 'guid', label: 'GUID (Microsoft)' },
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => {
                                                const v = opt.id as UuidVersion;
                                                setVersion(v);
                                                generateBatch(v, count, uppercase, hyphens, braces);
                                            }}
                                            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                                                version === opt.id
                                                    ? 'bg-white text-blue-700 shadow-xs'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Quantity ({count})
                                </label>
                                <div className="mt-2 flex items-center gap-2">
                                    {[1, 5, 10, 25, 50].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => {
                                                setCount(num);
                                                generateBatch(version, num, uppercase, hyphens, braces);
                                            }}
                                            className={`flex-1 rounded-xl border py-2 text-xs font-bold transition-all ${
                                                count === num
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Formatting options */}
                        <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-4">
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={uppercase}
                                    onChange={(e) => {
                                        setUppercase(e.target.checked);
                                        generateBatch(version, count, e.target.checked, hyphens, braces);
                                    }}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                Uppercase
                            </label>

                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hyphens}
                                    onChange={(e) => {
                                        setHyphens(e.target.checked);
                                        generateBatch(version, count, uppercase, e.target.checked, braces);
                                    }}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                Hyphens (-)
                            </label>

                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={braces}
                                    onChange={(e) => {
                                        setBraces(e.target.checked);
                                        generateBatch(version, count, uppercase, hyphens, e.target.checked);
                                    }}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                Braces {'{...}'}
                            </label>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-500">Output:</span>
                                <select
                                    value={format}
                                    onChange={(e) => setFormat(e.target.value as 'lines' | 'comma' | 'json')}
                                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none"
                                >
                                    <option value="lines">Lines</option>
                                    <option value="comma">Comma-separated</option>
                                    <option value="json">JSON Array</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Results Display */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Generated Output
                            </span>
                            <span className="text-xs text-slate-400">
                                {uuids.length} items
                            </span>
                        </div>

                        <div className="space-y-2">
                            {uuids.map((uuid, i) => (
                                <div
                                    key={i}
                                    className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 transition-colors hover:border-blue-200 hover:bg-blue-50/40"
                                >
                                    <span className="font-mono text-xs font-bold text-slate-800 sm:text-sm select-all">
                                        {uuid}
                                    </span>
                                    <button
                                        onClick={() => copySingle(uuid)}
                                        className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 shadow-2xs transition-colors hover:bg-blue-600 hover:text-white"
                                    >
                                        Copy
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
