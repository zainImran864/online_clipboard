'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { showToast } from '@/lib/appEvents';

interface DiffLine {
    type: 'same' | 'added' | 'removed' | 'empty';
    text: string;
    originalLine?: number;
    modifiedLine?: number;
}

function computeDiff(original: string, modified: string): { left: DiffLine[]; right: DiffLine[]; stats: { added: number; removed: number; unchanged: number } } {
    const origLines = original.split('\n');
    const modLines = modified.split('\n');

    const left: DiffLine[] = [];
    const right: DiffLine[] = [];
    let added = 0;
    let removed = 0;
    let unchanged = 0;

    const maxLen = Math.max(origLines.length, modLines.length);

    // Simple LCS-inspired line matching
    let i = 0;
    let j = 0;
    let origNum = 1;
    let modNum = 1;

    while (i < origLines.length || j < modLines.length) {
        const o = origLines[i];
        const m = modLines[j];

        if (i < origLines.length && j < modLines.length && o === m) {
            left.push({ type: 'same', text: o, originalLine: origNum++ });
            right.push({ type: 'same', text: m, modifiedLine: modNum++ });
            unchanged++;
            i++;
            j++;
        } else if (i < origLines.length && !modLines.includes(o, j)) {
            left.push({ type: 'removed', text: o, originalLine: origNum++ });
            right.push({ type: 'empty', text: '' });
            removed++;
            i++;
        } else if (j < modLines.length && !origLines.includes(m, i)) {
            left.push({ type: 'empty', text: '' });
            right.push({ type: 'added', text: m, modifiedLine: modNum++ });
            added++;
            j++;
        } else {
            // Both differ at current line
            if (i < origLines.length) {
                left.push({ type: 'removed', text: o, originalLine: origNum++ });
                removed++;
                i++;
            }
            if (j < modLines.length) {
                right.push({ type: 'added', text: m, modifiedLine: modNum++ });
                added++;
                j++;
            }
        }

        if (left.length > maxLen * 2 + 100) break; // safety guard
    }

    return { left, right, stats: { added, removed, unchanged } };
}

const SAMPLE_ORIGINAL = `function calculateTotal(items) {
  let sum = 0;
  for (let i = 0; i < items.length; i++) {
    sum += items[i].price;
  }
  return sum;
}`;

const SAMPLE_MODIFIED = `function calculateTotal(items, discount = 0) {
  const sum = items.reduce((acc, item) => acc + item.price, 0);
  const finalTotal = sum - discount;
  return Math.max(0, finalTotal);
}`;

export default function DiffCheckerPage() {
    const router = useRouter();
    const [original, setOriginal] = useState(SAMPLE_ORIGINAL);
    const [modified, setModified] = useState(SAMPLE_MODIFIED);
    const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

    const diffResult = useMemo(() => computeDiff(original, modified), [original, modified]);

    const swapTexts = () => {
        setOriginal(modified);
        setModified(original);
        showToast('Swapped Original and Modified text');
    };

    const shareDiffViaPasteport = () => {
        const unifiedText = [
            `--- Original`,
            `+++ Modified`,
            `@@ -1,${original.split('\n').length} +1,${modified.split('\n').length} @@`,
            ...diffResult.left.map((l, idx) => {
                const r = diffResult.right[idx];
                if (l.type === 'removed') return `- ${l.text}`;
                if (r && r.type === 'added') return `+ ${r.text}`;
                return `  ${l.text || (r ? r.text : '')}`;
            }),
        ].join('\n');

        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pasteport_prefill_text', unifiedText);
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
                                🔍 Developer Utilities
                            </div>
                            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                                Code & Text Diff Checker
                            </h1>
                            <p className="text-xs text-slate-500 sm:text-sm">
                                Compare changes between two snippets or configurations side-by-side. Completely client-side.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={shareDiffViaPasteport}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95"
                            >
                                🚀 Share Diff via Pasteport
                            </button>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={swapTexts}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95"
                            >
                                ⇄ Swap Texts
                            </button>
                            <button
                                onClick={() => {
                                    setOriginal(SAMPLE_ORIGINAL);
                                    setModified(SAMPLE_MODIFIED);
                                }}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95"
                            >
                                📋 Load Sample
                            </button>
                            <button
                                onClick={() => {
                                    setOriginal('');
                                    setModified('');
                                }}
                                className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 active:scale-95"
                            >
                                ✕ Clear
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Stats */}
                            <div className="flex items-center gap-2 text-xs font-mono">
                                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-emerald-800 font-bold">
                                    +{diffResult.stats.added}
                                </span>
                                <span className="rounded-md bg-red-100 px-2 py-0.5 text-red-800 font-bold">
                                    -{diffResult.stats.removed}
                                </span>
                            </div>

                            <div className="flex rounded-xl bg-slate-100 p-1">
                                <button
                                    onClick={() => setViewMode('split')}
                                    className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                                        viewMode === 'split' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
                                    }`}
                                >
                                    Split View
                                </button>
                                <button
                                    onClick={() => setViewMode('unified')}
                                    className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                                        viewMode === 'unified' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
                                    }`}
                                >
                                    Unified
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="space-y-1.5">
                            <span className="text-xs font-bold text-slate-600">Original (Before)</span>
                            <textarea
                                value={original}
                                onChange={(e) => setOriginal(e.target.value)}
                                placeholder="Paste original text / code..."
                                className="h-44 w-full rounded-2xl border-2 border-slate-200 p-3 font-mono text-xs leading-relaxed focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-xs font-bold text-slate-600">Modified (After)</span>
                            <textarea
                                value={modified}
                                onChange={(e) => setModified(e.target.value)}
                                placeholder="Paste modified text / code..."
                                className="h-44 w-full rounded-2xl border-2 border-slate-200 p-3 font-mono text-xs leading-relaxed focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Diff Output */}
                    <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-inner">
                        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600">
                            Diff Comparison Result
                        </div>

                        {viewMode === 'split' ? (
                            <div className="grid grid-cols-2 divide-x divide-slate-200 font-mono text-xs max-h-[480px] overflow-auto">
                                {/* Left Side */}
                                <div className="divide-y divide-slate-100">
                                    {diffResult.left.map((line, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex px-2 py-1 leading-relaxed ${
                                                line.type === 'removed'
                                                    ? 'bg-red-50 text-red-900 font-semibold'
                                                    : line.type === 'empty'
                                                    ? 'bg-slate-50/50 text-transparent select-none'
                                                    : 'text-slate-800'
                                            }`}
                                        >
                                            <span className="w-8 select-none text-[10px] text-slate-400">
                                                {line.originalLine || ''}
                                            </span>
                                            <span className="w-4 select-none text-slate-400">
                                                {line.type === 'removed' ? '-' : ' '}
                                            </span>
                                            <span className="flex-1 whitespace-pre-wrap">{line.text || ' '}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Right Side */}
                                <div className="divide-y divide-slate-100">
                                    {diffResult.right.map((line, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex px-2 py-1 leading-relaxed ${
                                                line.type === 'added'
                                                    ? 'bg-emerald-50 text-emerald-900 font-semibold'
                                                    : line.type === 'empty'
                                                    ? 'bg-slate-50/50 text-transparent select-none'
                                                    : 'text-slate-800'
                                            }`}
                                        >
                                            <span className="w-8 select-none text-[10px] text-slate-400">
                                                {line.modifiedLine || ''}
                                            </span>
                                            <span className="w-4 select-none text-slate-400">
                                                {line.type === 'added' ? '+' : ' '}
                                            </span>
                                            <span className="flex-1 whitespace-pre-wrap">{line.text || ' '}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="font-mono text-xs max-h-[480px] overflow-auto divide-y divide-slate-100">
                                {diffResult.left.map((l, idx) => {
                                    const r = diffResult.right[idx];
                                    if (l.type === 'removed') {
                                        return (
                                            <div key={idx} className="flex bg-red-50 px-3 py-1 text-red-900 font-semibold">
                                                <span className="w-8 select-none text-[10px] text-red-400">{l.originalLine}</span>
                                                <span className="w-4 select-none text-red-500">-</span>
                                                <span className="whitespace-pre-wrap">{l.text}</span>
                                            </div>
                                        );
                                    }
                                    if (r && r.type === 'added') {
                                        return (
                                            <div key={idx} className="flex bg-emerald-50 px-3 py-1 text-emerald-900 font-semibold">
                                                <span className="w-8 select-none text-[10px] text-emerald-400">{r.modifiedLine}</span>
                                                <span className="w-4 select-none text-emerald-500">+</span>
                                                <span className="whitespace-pre-wrap">{r.text}</span>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div key={idx} className="flex px-3 py-1 text-slate-800">
                                            <span className="w-8 select-none text-[10px] text-slate-400">{l.originalLine || r?.modifiedLine}</span>
                                            <span className="w-4 select-none text-slate-300"> </span>
                                            <span className="whitespace-pre-wrap">{l.text || r?.text}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
