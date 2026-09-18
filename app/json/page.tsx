'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { showToast } from '@/lib/appEvents';

interface JsonTreeNodeProps {
    dataKey?: string;
    value: unknown;
    depth?: number;
    searchQuery: string;
}

function JsonTreeNode({ dataKey, value, depth = 0, searchQuery }: JsonTreeNodeProps) {
    const [collapsed, setCollapsed] = useState(depth > 2);

    const isObject = value !== null && typeof value === 'object';
    const isArray = Array.isArray(value);

    // Filter matching
    const matchesSearch = useMemo(() => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        if (dataKey && dataKey.toLowerCase().includes(q)) return true;
        if (!isObject && String(value).toLowerCase().includes(q)) return true;
        return false;
    }, [dataKey, value, isObject, searchQuery]);

    if (!matchesSearch && !isObject) {
        return null;
    }

    if (isObject) {
        const entries = isArray
            ? (value as unknown[]).map((v, i) => [i.toString(), v] as const)
            : Object.entries(value as Record<string, unknown>);

        const count = entries.length;

        return (
            <div className="font-mono text-xs leading-relaxed">
                <div
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex cursor-pointer items-center gap-1.5 rounded-sm px-1 py-0.5 hover:bg-slate-100"
                    style={{ paddingLeft: `${depth * 16}px` }}
                >
                    <span className="text-[10px] text-slate-400 select-none">
                        {collapsed ? '▶' : '▼'}
                    </span>
                    {dataKey && (
                        <span className="font-bold text-indigo-700">&quot;{dataKey}&quot;: </span>
                    )}
                    <span className="text-slate-500">
                        {isArray ? `Array[${count}]` : `Object{${count}}`}
                    </span>
                </div>

                {!collapsed && (
                    <div>
                        {entries.map(([k, v]) => (
                            <JsonTreeNode
                                key={k}
                                dataKey={isArray ? undefined : k}
                                value={v}
                                depth={depth + 1}
                                searchQuery={searchQuery}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Primitive values
    let valClass = 'text-slate-800';
    let formattedVal = String(value);

    if (typeof value === 'string') {
        valClass = 'text-emerald-700';
        formattedVal = `"${value}"`;
    } else if (typeof value === 'number') {
        valClass = 'text-amber-600 font-bold';
    } else if (typeof value === 'boolean') {
        valClass = 'text-purple-700 font-bold';
    } else if (value === null) {
        valClass = 'text-rose-500 italic';
        formattedVal = 'null';
    }

    return (
        <div
            className="flex items-center gap-1.5 font-mono text-xs leading-relaxed px-1 py-0.5 hover:bg-slate-50"
            style={{ paddingLeft: `${depth * 16 + 14}px` }}
        >
            {dataKey && (
                <span className="font-bold text-indigo-700">&quot;{dataKey}&quot;: </span>
            )}
            <span className={valClass}>{formattedVal}</span>
        </div>
    );
}

const SAMPLE_JSON = `{
  "app": "Pasteport",
  "version": "1.0.0",
  "features": [
    "Instant 6-digit codes",
    "24-Hour Auto-Purge",
    "Real-time Live Sync",
    "Client-Side Dev Utilities"
  ],
  "security": {
    "zeroKnowledge": true,
    "r2Sandboxed": true,
    "selfDestructPin": 9842
  },
  "stats": {
    "activeUsers": 1250,
    "averageSizeKb": 42.5
  }
}`;

export default function JsonFormatterPage() {
    const router = useRouter();
    const [rawInput, setRawInput] = useState<string>(SAMPLE_JSON);
    const [parsedData, setParsedData] = useState<unknown>(() => {
        try {
            return JSON.parse(SAMPLE_JSON);
        } catch {
            return null;
        }
    });
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'tree' | 'code'>('code');
    const [searchQuery, setSearchQuery] = useState('');

    const handleInputChange = (val: string) => {
        setRawInput(val);
        if (!val.trim()) {
            setParsedData(null);
            setError(null);
            return;
        }

        try {
            const parsed = JSON.parse(val);
            setParsedData(parsed);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid JSON format');
            setParsedData(null);
        }
    };

    const formatJson = (spaces = 2) => {
        try {
            const parsed = JSON.parse(rawInput);
            const formatted = JSON.stringify(parsed, null, spaces);
            setRawInput(formatted);
            setParsedData(parsed);
            setError(null);
            showToast(`Formatted with ${spaces} spaces`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid JSON syntax');
        }
    };

    const minifyJson = () => {
        try {
            const parsed = JSON.parse(rawInput);
            const minified = JSON.stringify(parsed);
            setRawInput(minified);
            setParsedData(parsed);
            setError(null);
            showToast('JSON Minified to single line');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid JSON syntax');
        }
    };

    const copyToClipboard = async () => {
        if (!rawInput.trim()) return;
        await navigator.clipboard.writeText(rawInput);
        showToast('JSON copied to clipboard');
    };

    const downloadJsonFile = () => {
        if (!rawInput.trim()) return;
        const blob = new Blob([rawInput], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pasteport-payload.json';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Downloaded pasteport-payload.json');
    };

    const shareViaPasteport = () => {
        if (!rawInput.trim()) return;
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pasteport_prefill_text', rawInput);
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
                            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                                🌲 Client-Side Utility
                            </div>
                            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                                JSON Formatter & Tree Inspector
                            </h1>
                            <p className="text-xs text-slate-500 sm:text-sm">
                                Validate, beautify, minify, and explore nested JSON payloads with zero server transmission.
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={shareViaPasteport}
                                disabled={!rawInput.trim() || Boolean(error)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
                            >
                                🚀 Share via Pasteport
                            </button>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => formatJson(2)}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95"
                            >
                                ✨ 2 Spaces
                            </button>
                            <button
                                onClick={() => formatJson(4)}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95"
                            >
                                ✨ 4 Spaces
                            </button>
                            <button
                                onClick={minifyJson}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95"
                            >
                                📦 Minify
                            </button>
                            <button
                                onClick={() => {
                                    setRawInput(SAMPLE_JSON);
                                    handleInputChange(SAMPLE_JSON);
                                }}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95"
                            >
                                📋 Load Sample
                            </button>
                            <button
                                onClick={() => handleInputChange('')}
                                className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 active:scale-95"
                            >
                                ✕ Clear
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex rounded-xl bg-slate-100 p-1">
                                <button
                                    onClick={() => setViewMode('code')}
                                    className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                                        viewMode === 'code' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
                                    }`}
                                >
                                    Code Editor
                                </button>
                                <button
                                    onClick={() => setViewMode('tree')}
                                    disabled={!parsedData}
                                    className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                                        viewMode === 'tree' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
                                    } disabled:opacity-40`}
                                >
                                    Tree View
                                </button>
                            </div>
                            <button
                                onClick={copyToClipboard}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95"
                            >
                                📋 Copy
                            </button>
                            <button
                                onClick={downloadJsonFile}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95"
                            >
                                ⬇ Download
                            </button>
                        </div>
                    </div>

                    {/* Main Workspace */}
                    <div className="grid gap-4 lg:grid-cols-2">
                        {/* Editor Left */}
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                                <span>Input / Editor</span>
                                <span>{rawInput.length} chars</span>
                            </div>
                            <textarea
                                value={rawInput}
                                onChange={(e) => handleInputChange(e.target.value)}
                                placeholder="Paste or type raw JSON here..."
                                spellCheck={false}
                                className={`h-[480px] w-full rounded-2xl border-2 p-4 font-mono text-xs leading-relaxed focus:outline-none ${
                                    error
                                        ? 'border-red-400 bg-red-50/20 text-red-950 focus:border-red-500'
                                        : 'border-slate-200 bg-white text-slate-800 focus:border-blue-500'
                                }`}
                            />
                            {error && (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                                    <strong>Syntax Error:</strong> {error}
                                </div>
                            )}
                        </div>

                        {/* Visualizer Right */}
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                                <span>{viewMode === 'tree' ? 'Collapsible Tree Inspector' : 'Formatted Code Preview'}</span>
                                {viewMode === 'tree' && (
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search keys or values..."
                                        className="rounded-lg border border-slate-200 px-2 py-0.5 text-xs font-normal focus:border-blue-500 focus:outline-none"
                                    />
                                )}
                            </div>

                            <div className="h-[480px] w-full overflow-auto rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-inner">
                                {error ? (
                                    <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                                        <p className="text-2xl">⚠️</p>
                                        <p className="mt-2 text-xs font-bold text-slate-600">Unable to parse JSON</p>
                                        <p className="mt-1 text-[11px] text-slate-400">Fix the syntax error on the left to inspect</p>
                                    </div>
                                ) : !rawInput.trim() ? (
                                    <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                                        <p className="text-2xl">🌲</p>
                                        <p className="mt-2 text-xs font-bold text-slate-600">JSON Preview will appear here</p>
                                    </div>
                                ) : viewMode === 'tree' && parsedData ? (
                                    <JsonTreeNode value={parsedData} searchQuery={searchQuery} />
                                ) : (
                                    <pre className="font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                                        {rawInput}
                                    </pre>
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
