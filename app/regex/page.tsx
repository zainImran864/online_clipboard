'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { showToast } from '@/lib/appEvents';

interface Preset {
    name: string;
    regex: string;
    flags: string;
    sample: string;
    description: string;
}

const PRESETS: Preset[] = [
    {
        name: 'Email Address',
        regex: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
        flags: 'gi',
        sample: 'Contact us at support@pasteport.com or sales.dev@enterprise.org for questions.',
        description: 'Standard email address validator matching user@domain.tld',
    },
    {
        name: 'URL (HTTP/HTTPS)',
        regex: 'https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)',
        flags: 'gi',
        sample: 'Visit https://pasteport.zain-imran.com/send or https://github.com/zainImran864 for docs.',
        description: 'Matches valid web URLs with schemes, paths, and query params',
    },
    {
        name: 'IPv4 Address',
        regex: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
        flags: 'g',
        sample: 'Local: 127.0.0.1, Gateway: 192.168.1.1, DNS: 8.8.8.8, Invalid: 999.12.34.56',
        description: 'Matches 0.0.0.0 to 255.255.255.255 IP addresses',
    },
    {
        name: 'Hex Color Code',
        regex: '#(?:[0-9a-fA-F]{3}){1,2}\\b',
        flags: 'gi',
        sample: 'Colors: #ffffff (white), #2563EB (blue), #000 (black), #a855f7 (purple).',
        description: 'Matches 3-digit and 6-digit hex color representations',
    },
    {
        name: 'Date (YYYY-MM-DD)',
        regex: '\\b(\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])\\b',
        flags: 'g',
        sample: 'Event dates: 2026-09-19, release on 2026-10-01, invalid: 2026-19-44.',
        description: 'Matches ISO-8601 calendar date format with capture groups',
    },
    {
        name: 'HTML Tag',
        regex: '<([a-z1-6]+)(?:\\s+[^>]*?)?(?:>(.*?)<\\/\\1>|\\s*\\/>)',
        flags: 'gi',
        sample: '<div className="hero"><h1 id="title">Pasteport</h1><img src="icon.svg" /></div>',
        description: 'Matches HTML tags, element names, and inner contents',
    },
];

interface MatchResult {
    index: number;
    match: string;
    groups: string[];
}

export default function RegexTesterPage() {
    const router = useRouter();
    const [pattern, setPattern] = useState('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
    const [flags, setFlags] = useState<{ [key: string]: boolean }>({
        g: true,
        i: true,
        m: false,
        s: false,
        u: false,
    });
    const [testString, setTestString] = useState(
        'Welcome to Pasteport! Reach us at dev@pasteport.com or visit support@zain-imran.com.'
    );

    const activeFlagsStr = useMemo(() => {
        return Object.entries(flags)
            .filter(([, active]) => active)
            .map(([f]) => f)
            .join('');
    }, [flags]);

    const { matches, error } = useMemo(() => {
        if (!pattern) {
            return { matches: [], error: null };
        }

        try {
            const re = new RegExp(pattern, activeFlagsStr);
            const found: MatchResult[] = [];

            if (flags.g) {
                let m: RegExpExecArray | null;
                let guard = 0;
                while ((m = re.exec(testString)) !== null && guard < 500) {
                    guard++;
                    found.push({
                        index: m.index,
                        match: m[0],
                        groups: m.slice(1),
                    });
                    if (m.index === re.lastIndex) {
                        re.lastIndex++;
                    }
                }
            } else {
                const m = re.exec(testString);
                if (m) {
                    found.push({
                        index: m.index,
                        match: m[0],
                        groups: m.slice(1),
                    });
                }
            }

            return {
                matches: found,
                error: null,
            };
        } catch (err) {
            return {
                matches: [],
                error: err instanceof Error ? err.message : 'Invalid Regular Expression',
            };
        }
    }, [pattern, activeFlagsStr, testString, flags.g]);

    const toggleFlag = (flag: string) => {
        setFlags((prev) => ({ ...prev, [flag]: !prev[flag] }));
    };

    const applyPreset = (preset: Preset) => {
        setPattern(preset.regex);
        const newFlags: { [key: string]: boolean } = {
            g: preset.flags.includes('g'),
            i: preset.flags.includes('i'),
            m: preset.flags.includes('m'),
            s: preset.flags.includes('s'),
            u: preset.flags.includes('u'),
        };
        setFlags(newFlags);
        setTestString(preset.sample);
        showToast(`Loaded preset: ${preset.name}`);
    };

    const copyMatches = async () => {
        if (!matches.length) return;
        const text = matches.map((m) => m.match).join('\n');
        await navigator.clipboard.writeText(text);
        showToast(`Copied ${matches.length} matches to clipboard`);
    };

    const shareViaPasteport = () => {
        if (!pattern.trim()) return;
        const summary = `Regex: /${pattern}/${activeFlagsStr}\n\nMatches (${matches.length}):\n${matches.map((m, i) => `${i + 1}. ${m.match}`).join('\n')}\n\nTest Text:\n${testString}`;
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pasteport_prefill_text', summary);
            router.push('/send');
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Navbar />

            <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
                <div className="mx-auto max-w-6xl space-y-6">
                    {/* Header */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                                ⚡ Client-Side Regex Engine
                            </div>
                            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                                Regex Tester & Matcher
                            </h1>
                            <p className="text-xs text-slate-500 sm:text-sm">
                                Test regular expressions in real time with group inspector, capture highlighting, and common presets.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={copyMatches}
                                disabled={!matches.length}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 disabled:opacity-50"
                            >
                                📋 Copy Matches ({matches.length})
                            </button>
                            <button
                                onClick={shareViaPasteport}
                                disabled={!pattern.trim()}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
                            >
                                🚀 Share via Pasteport
                            </button>
                        </div>
                    </div>

                    {/* Regex Input & Flags */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5 space-y-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <span className="font-mono text-xl font-bold text-slate-400">/</span>
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={pattern}
                                    onChange={(e) => setPattern(e.target.value)}
                                    placeholder="Enter regular expression..."
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                                />
                            </div>
                            <span className="font-mono text-xl font-bold text-slate-400">/</span>
                            <div className="flex flex-wrap items-center gap-1">
                                {[
                                    { flag: 'g', label: 'global (g)' },
                                    { flag: 'i', label: 'ignore case (i)' },
                                    { flag: 'm', label: 'multiline (m)' },
                                    { flag: 's', label: 'dotAll (s)' },
                                    { flag: 'u', label: 'unicode (u)' },
                                ].map(({ flag, label }) => (
                                    <button
                                        key={flag}
                                        type="button"
                                        onClick={() => toggleFlag(flag)}
                                        className={`rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold transition-colors ${
                                            flags[flag]
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                        title={label}
                                    >
                                        {flag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                                ⚠️ {error}
                            </div>
                        )}
                    </div>

                    {/* Presets Strip */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">
                            Presets:
                        </span>
                        {PRESETS.map((preset) => (
                            <button
                                key={preset.name}
                                onClick={() => applyPreset(preset)}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 transition-colors"
                            >
                                {preset.name}
                            </button>
                        ))}
                    </div>

                    {/* Dual Pane: Test String & Matches */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Test String */}
                        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
                            <div className="mb-2 flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Test String
                                </label>
                                <span className="text-xs text-slate-400">
                                    {testString.length} chars
                                </span>
                            </div>
                            <textarea
                                value={testString}
                                onChange={(e) => setTestString(e.target.value)}
                                placeholder="Paste or type test string here..."
                                rows={10}
                                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                            />
                        </div>

                        {/* Matches Inspector */}
                        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
                            <div className="mb-2 flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Matches ({matches.length})
                                </label>
                                <span className="text-[11px] font-mono text-slate-400">
                                    /{activeFlagsStr}
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto max-h-80 space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                {matches.length === 0 ? (
                                    <div className="flex h-full min-h-[160px] items-center justify-center text-xs text-slate-400">
                                        {error ? 'Fix regex syntax error above' : 'No matches found'}
                                    </div>
                                ) : (
                                    matches.map((m, idx) => (
                                        <div
                                            key={idx}
                                            className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs text-xs"
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="font-bold text-blue-600">
                                                    Match #{idx + 1}
                                                </span>
                                                <span className="font-mono text-[10px] text-slate-400">
                                                    index: {m.index}..{m.index + m.match.length}
                                                </span>
                                            </div>
                                            <div className="font-mono font-bold bg-blue-50 text-blue-900 px-2 py-1 rounded">
                                                {m.match}
                                            </div>
                                            {m.groups.length > 0 && (
                                                <div className="mt-2 space-y-1 border-t border-slate-100 pt-1.5 text-[11px]">
                                                    <span className="text-slate-400 font-medium">Capture Groups:</span>
                                                    {m.groups.map((grp, gIdx) => (
                                                        <div key={gIdx} className="flex items-center gap-1.5 font-mono">
                                                            <span className="text-slate-400 font-bold">${gIdx + 1}:</span>
                                                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                                                                {grp || '(empty)'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
