'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { showToast } from '@/lib/appEvents';

interface ParamItem {
    id: string;
    key: string;
    value: string;
    enabled?: boolean;
}

const SAMPLE_URLS = [
    {
        name: 'OAuth 2.0 Auth Request',
        url: 'https://auth.example.com/oauth/authorize?response_type=code&client_id=pasteport_app_992&redirect_uri=https%3A%2F%2Fpasteport.zain-imran.com%2Fcallback&scope=read+write&state=xyz123#token_target',
    },
    {
        name: 'API Search Query',
        url: 'https://api.pasteport.zain-imran.com/v1/clips?category=code&sort=desc&limit=25&verified=true',
    },
    {
        name: 'UTM Marketing Campaign',
        url: 'https://pasteport.zain-imran.com/send?utm_source=twitter&utm_medium=social&utm_campaign=launch2026&ref=dev_toolkit',
    },
];

export default function UrlParserPage() {
    const router = useRouter();
    const [rawUrl, setRawUrl] = useState<string>(SAMPLE_URLS[0].url);

    // Parse URL & Query Parameters
    const { parsed, queryParams, error } = useMemo(() => {
        try {
            const u = new URL(rawUrl.trim());
            const paramsList: ParamItem[] = [];
            let i = 0;
            u.searchParams.forEach((val, key) => {
                paramsList.push({
                    id: `param_${i++}_${key}`,
                    key,
                    value: val,
                    enabled: true,
                });
            });
            return {
                parsed: {
                    protocol: u.protocol,
                    hostname: u.hostname,
                    port: u.port || (u.protocol === 'https:' ? '443' : '80'),
                    pathname: u.pathname,
                    hash: u.hash,
                },
                queryParams: paramsList,
                error: null,
            };
        } catch {
            return { parsed: null, queryParams: [], error: 'Invalid URL format' };
        }
    }, [rawUrl]);

    const handleParamChange = (index: number, field: 'key' | 'value', val: string) => {
        try {
            const u = new URL(rawUrl.trim());
            const entries = Array.from(u.searchParams.entries());
            const sp = new URLSearchParams();
            entries.forEach(([k, v], idx) => {
                if (idx === index) {
                    sp.append(field === 'key' ? val : k, field === 'value' ? val : v);
                } else {
                    sp.append(k, v);
                }
            });
            const searchStr = sp.toString();
            u.search = searchStr ? `?${searchStr}` : '';
            setRawUrl(u.toString());
        } catch {
            // ignore
        }
    };

    const deleteParam = (index: number) => {
        try {
            const u = new URL(rawUrl.trim());
            const entries = Array.from(u.searchParams.entries());
            const sp = new URLSearchParams();
            entries.forEach(([k, v], idx) => {
                if (idx !== index) {
                    sp.append(k, v);
                }
            });
            const searchStr = sp.toString();
            u.search = searchStr ? `?${searchStr}` : '';
            setRawUrl(u.toString());
            showToast('Parameter deleted');
        } catch {
            // ignore
        }
    };

    const addParam = () => {
        try {
            const u = new URL(rawUrl.trim());
            u.searchParams.append('key', 'value');
            setRawUrl(u.toString());
            showToast('Parameter added');
        } catch {
            // ignore
        }
    };

    const copyText = async (text: string, label = 'Copied') => {
        await navigator.clipboard.writeText(text);
        showToast(`${label} copied to clipboard`);
    };

    const shareViaPasteport = () => {
        if (!rawUrl.trim()) return;
        const details = `URL: ${rawUrl}\n\nProtocol: ${parsed?.protocol}\nHostname: ${parsed?.hostname}\nPathname: ${parsed?.pathname}\nHash: ${parsed?.hash}\n\nQuery Parameters:\n${queryParams.map((p) => `  ${p.key}: ${p.value}`).join('\n')}`;
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pasteport_prefill_text', details);
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
                                🔗 Web URI Engine
                            </div>
                            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                                URL Parser & Query Parameter Editor
                            </h1>
                            <p className="text-xs text-slate-500 sm:text-sm">
                                Deconstruct URLs, inspect query parameters, edit values in real time, and encode components safely.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => copyText(rawUrl, 'URL')}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95"
                            >
                                📋 Copy URL
                            </button>
                            <button
                                onClick={shareViaPasteport}
                                disabled={!parsed}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
                            >
                                🚀 Share via Pasteport
                            </button>
                        </div>
                    </div>

                    {/* URL Input Bar */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5 space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Target URL
                        </label>
                        <input
                            type="text"
                            value={rawUrl}
                            onChange={(e) => setRawUrl(e.target.value)}
                            placeholder="https://example.com/path?key=value#hash"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none sm:text-sm"
                        />

                        {error && (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
                                ⚠️ {error}. Please enter a valid URL including protocol (http:// or https://).
                            </div>
                        )}

                        {/* Presets */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Try sample:
                            </span>
                            {SAMPLE_URLS.map((s) => (
                                <button
                                    key={s.name}
                                    onClick={() => setRawUrl(s.url)}
                                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                                >
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {parsed && (
                        <>
                            {/* Breakdown Cards */}
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {[
                                    { label: 'Protocol', val: parsed.protocol, icon: '🔒' },
                                    { label: 'Hostname', val: parsed.hostname, icon: '🌐' },
                                    { label: 'Port', val: parsed.port, icon: '🔌' },
                                    { label: 'Pathname', val: parsed.pathname, icon: '📁' },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs"
                                    >
                                        <div className="flex items-center justify-between text-slate-400 mb-1">
                                            <span className="text-[10px] font-extrabold uppercase tracking-wider">
                                                {item.label}
                                            </span>
                                            <span className="text-sm">{item.icon}</span>
                                        </div>
                                        <p className="font-mono text-xs font-bold text-slate-800 break-all select-all">
                                            {item.val || '(none)'}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Query Parameters Table */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900">
                                            Query Parameters ({queryParams.length})
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            Edits update the target URL immediately.
                                        </p>
                                    </div>
                                    <button
                                        onClick={addParam}
                                        className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 active:scale-95"
                                    >
                                        ➕ Add Param
                                    </button>
                                </div>

                                {queryParams.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                                        No query parameters found in this URL. Click &quot;Add Param&quot; to append one!
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                                        {queryParams.map((p, idx) => (
                                            <div
                                                key={p.id}
                                                className="flex items-center gap-3 p-3 bg-white transition-colors"
                                            >
                                                <input
                                                    type="text"
                                                    value={p.key}
                                                    onChange={(e) => handleParamChange(idx, 'key', e.target.value)}
                                                    placeholder="key"
                                                    className="w-1/3 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-xs font-bold text-blue-700 focus:bg-white focus:outline-none"
                                                />
                                                <span className="text-slate-400 font-mono font-bold">=</span>
                                                <input
                                                    type="text"
                                                    value={p.value}
                                                    onChange={(e) => handleParamChange(idx, 'value', e.target.value)}
                                                    placeholder="value"
                                                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-xs text-slate-800 focus:bg-white focus:outline-none"
                                                />
                                                <button
                                                    onClick={() => deleteParam(idx)}
                                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                                    title="Delete"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
