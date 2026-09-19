'use client';

import React, { useState, useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { showToast } from '@/lib/appEvents';

function getRelativeTime(timestampMs: number, referenceMs = 0): string {
    const current = referenceMs || timestampMs;
    const diffSec = Math.round((timestampMs - current) / 1000);
    const absSec = Math.abs(diffSec);

    let val = '';
    if (absSec < 5) val = 'just now';
    else if (absSec < 60) val = `${absSec} seconds`;
    else if (absSec < 3600) val = `${Math.floor(absSec / 60)} minutes`;
    else if (absSec < 86400) val = `${Math.floor(absSec / 3600)} hours`;
    else if (absSec < 2592000) val = `${Math.floor(absSec / 86400)} days`;
    else val = `${Math.floor(absSec / 2592000)} months`;

    if (absSec < 5) return val;
    return diffSec > 0 ? `in ${val}` : `${val} ago`;
}

function subscribeTimestampClock(callback: () => void) {
    const timer = setInterval(callback, 1000);
    return () => clearInterval(timer);
}

function getTimestampClockSnapshot() {
    return Date.now();
}

function getServerTimestampClockSnapshot() {
    return 1774000000000;
}

export default function TimestampConverterPage() {
    const router = useRouter();

    const liveNow = useSyncExternalStore(subscribeTimestampClock, getTimestampClockSnapshot, getServerTimestampClockSnapshot);
    const [isLive, setIsLive] = useState<boolean>(true);
    const [frozenNow, setFrozenNow] = useState<number>(0);

    const now = isLive ? liveNow : (frozenNow || liveNow);

    // Direction 1: Timestamp to Date
    const [tsInput, setTsInput] = useState<string>('1774000000');
    const [tsUnit, setTsUnit] = useState<'sec' | 'ms'>('sec');

    // Direction 2: Date to Timestamp
    const [dateInput, setDateInput] = useState<string>('2026-09-19T12:00');

    const parsedDateFromTs = useMemo(() => {
        const clean = tsInput.trim();
        if (!clean || isNaN(Number(clean))) return null;
        const num = Number(clean);
        const ms = tsUnit === 'sec' ? num * 1000 : num;
        const d = new Date(ms);
        return isNaN(d.getTime()) ? null : d;
    }, [tsInput, tsUnit]);

    const parsedTsFromDate = useMemo(() => {
        if (!dateInput) return null;
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return null;
        return {
            sec: Math.floor(d.getTime() / 1000),
            ms: d.getTime(),
        };
    }, [dateInput]);

    const applyOffset = (seconds: number) => {
        const base = parsedDateFromTs ? parsedDateFromTs.getTime() : (now || 1774000000000);
        const targetMs = base + seconds * 1000;
        setTsInput(tsUnit === 'sec' ? Math.floor(targetMs / 1000).toString() : targetMs.toString());
        showToast('Offset applied');
    };

    const copyText = async (text: string, label = 'Copied') => {
        await navigator.clipboard.writeText(text);
        showToast(`${label} copied to clipboard`);
    };

    const shareViaPasteport = () => {
        if (!parsedDateFromTs) return;
        const summary = `Unix Epoch Timestamp:\n${tsInput} (${tsUnit})\n\nUTC: ${parsedDateFromTs.toUTCString()}\nISO 8601: ${parsedDateFromTs.toISOString()}\nLocal: ${parsedDateFromTs.toLocaleString()}\nRelative: ${getRelativeTime(parsedDateFromTs.getTime(), now)}`;
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
                                ⏱️ Time & Date Engine
                            </div>
                            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                                Unix Timestamp & Epoch Converter
                            </h1>
                            <p className="text-xs text-slate-500 sm:text-sm">
                                Convert Unix epoch timestamps to human readable dates, ISO-8601, RFC 2822, and relative times.
                            </p>
                        </div>

                        <button
                            onClick={shareViaPasteport}
                            disabled={!parsedDateFromTs}
                            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
                        >
                            🚀 Share via Pasteport
                        </button>
                    </div>

                    {/* Live Clock Card */}
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5 shadow-xs">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Current Unix Timestamp
                                </span>
                            </div>
                            <div className="mt-1 flex items-baseline gap-3">
                                <span className="font-mono text-3xl font-extrabold text-blue-900">
                                    {Math.floor(now / 1000)}
                                </span>
                                <span className="font-mono text-sm text-slate-500">
                                    .{now % 1000} ms
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    if (isLive) {
                                        setFrozenNow(liveNow);
                                        setIsLive(false);
                                    } else {
                                        setIsLive(true);
                                    }
                                }}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
                            >
                                {isLive ? '⏸️ Pause' : '▶️ Resume'}
                            </button>
                            <button
                                onClick={() => copyText(Math.floor(now / 1000).toString(), 'Current seconds')}
                                className="rounded-xl border border-blue-200 bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-700"
                            >
                                Copy Seconds
                            </button>
                        </div>
                    </div>

                    {/* Section 1: Timestamp -> Human Date */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-base font-bold text-slate-900">
                                🔄 Timestamp to Human Date
                            </h2>
                            <div className="flex items-center gap-1 text-xs">
                                <button
                                    onClick={() => setTsUnit('sec')}
                                    className={`rounded-lg px-2.5 py-1 font-bold ${tsUnit === 'sec' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                                >
                                    Seconds (10 digits)
                                </button>
                                <button
                                    onClick={() => setTsUnit('ms')}
                                    className={`rounded-lg px-2.5 py-1 font-bold ${tsUnit === 'ms' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                                >
                                    Milliseconds (13 digits)
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={tsInput}
                                onChange={(e) => setTsInput(e.target.value)}
                                placeholder="Enter timestamp (e.g. 1774000000)..."
                                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                            />
                            <button
                                onClick={() => setTsInput(tsUnit === 'sec' ? Math.floor(Date.now() / 1000).toString() : Date.now().toString())}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                            >
                                Set to Now
                            </button>
                        </div>

                        {/* Relative offset pills */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="text-slate-400 font-bold uppercase text-[10px] mr-1">Offsets:</span>
                            {[
                                { label: '+1 Hour', sec: 3600 },
                                { label: '+1 Day', sec: 86400 },
                                { label: '+1 Week', sec: 604800 },
                                { label: '+30 Days', sec: 2592000 },
                                { label: '-1 Day', sec: -86400 },
                            ].map((offset) => (
                                <button
                                    key={offset.label}
                                    onClick={() => applyOffset(offset.sec)}
                                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                >
                                    {offset.label}
                                </button>
                            ))}
                        </div>

                        {/* Formatted Date Outputs Table */}
                        {parsedDateFromTs ? (
                            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden text-xs">
                                {[
                                    { label: 'UTC (GMT)', val: parsedDateFromTs.toUTCString() },
                                    { label: 'ISO 8601', val: parsedDateFromTs.toISOString() },
                                    { label: 'Local Time', val: parsedDateFromTs.toLocaleString() },
                                    { label: 'Relative', val: getRelativeTime(parsedDateFromTs.getTime(), now) },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="flex items-center justify-between p-3 hover:bg-white transition-colors"
                                    >
                                        <span className="w-28 font-bold text-slate-500">{item.label}</span>
                                        <span className="flex-1 font-mono font-semibold text-slate-800 break-all select-all">
                                            {item.val}
                                        </span>
                                        <button
                                            onClick={() => copyText(item.val, item.label)}
                                            className="ml-2 rounded-md bg-white border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                                ⚠️ Invalid timestamp. Please provide a numeric value.
                            </div>
                        )}
                    </div>

                    {/* Section 2: Human Date -> Timestamp */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                        <h2 className="text-base font-bold text-slate-900">
                            📅 Date to Unix Timestamp
                        </h2>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="datetime-local"
                                value={dateInput}
                                onChange={(e) => setDateInput(e.target.value)}
                                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                            />
                        </div>

                        {parsedTsFromDate && (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Seconds</p>
                                        <p className="font-mono text-lg font-extrabold text-blue-900">{parsedTsFromDate.sec}</p>
                                    </div>
                                    <button
                                        onClick={() => copyText(parsedTsFromDate.sec.toString(), 'Seconds')}
                                        className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                                    >
                                        Copy
                                    </button>
                                </div>

                                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Milliseconds</p>
                                        <p className="font-mono text-lg font-extrabold text-indigo-900">{parsedTsFromDate.ms}</p>
                                    </div>
                                    <button
                                        onClick={() => copyText(parsedTsFromDate.ms.toString(), 'Milliseconds')}
                                        className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
