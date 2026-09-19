'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { showToast } from '@/lib/appEvents';

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pasteport Preview</title>
<style>
body { font-family: system-ui, sans-serif; background: #f8fafc; margin: 0; padding: 2rem; display: flex; justify-content: center; }
.card { background: white; border-radius: 16px; padding: 24px; max-width: 420px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; }
.badge { background: #dbeafe; color: #1d4ed8; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; }
h2 { margin: 12px 0 8px; font-size: 20px; color: #0f172a; }
p { color: #64748b; font-size: 14px; line-height: 1.5; margin: 0 0 16px; }
.btn { background: #2563eb; color: white; border: none; padding: 10px 18px; border-radius: 10px; font-weight: bold; font-size: 14px; cursor: pointer; }
.btn:hover { background: #1d4ed8; }
</style>
</head>
<body>
<div class="card">
<span class="badge">🚀 Instant Sync</span>
<h2>Pasteport Developer Suite</h2>
<p>Cross-device clipboard sharing paired with zero-server privacy utilities.</p>
<button class="btn" onclick="alert('Hello from Pasteport sandbox!')">Click Test</button>
</div>
</body>
</html>`;

export default function HtmlFormatterPage() {
    const router = useRouter();
    const [rawHtml, setRawHtml] = useState<string>(SAMPLE_HTML);
    const [indentSpaces, setIndentSpaces] = useState<number>(2);
    const [viewMode, setViewMode] = useState<'split' | 'code' | 'preview'>('split');

    const beautifyHtml = (htmlStr: string, spaces: number): string => {
        const indentStr = ' '.repeat(spaces);
        let formatted = '';
        let indentLevel = 0;

        // Strip extraneous whitespace between tags
        const tokens = htmlStr
            .replace(/>\s*</g, '><')
            .replace(/</g, '~::~<')
            .replace(/>/g, '>~::~')
            .split('~::~')
            .filter((t) => t.trim().length > 0);

        const voidTags = new Set([
            'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
            'link', 'meta', 'param', 'source', 'track', 'wbr', '!doctype'
        ]);

        for (const token of tokens) {
            const trimmed = token.trim();
            if (!trimmed) continue;

            // Closing tag
            if (trimmed.startsWith('</')) {
                indentLevel = Math.max(0, indentLevel - 1);
                formatted += `${indentStr.repeat(indentLevel)}${trimmed}\n`;
            }
            // Opening tag or void tag
            else if (trimmed.startsWith('<') && !trimmed.startsWith('<!--')) {
                const tagNameMatch = trimmed.match(/^<([a-zA-Z0-9!-]+)/);
                const tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : '';
                const isVoid = voidTags.has(tagName) || trimmed.endsWith('/>');

                formatted += `${indentStr.repeat(indentLevel)}${trimmed}\n`;
                if (!isVoid && !trimmed.includes('</')) {
                    indentLevel++;
                }
            }
            // Text or comments
            else {
                formatted += `${indentStr.repeat(indentLevel)}${trimmed}\n`;
            }
        }

        return formatted.trim();
    };

    const handleBeautify = () => {
        const result = beautifyHtml(rawHtml, indentSpaces);
        setRawHtml(result);
        showToast('HTML Beautified');
    };

    const handleMinify = () => {
        const minified = rawHtml
            .replace(/<!--[\s\S]*?-->/g, '') // remove comments
            .replace(/\s+/g, ' ')
            .replace(/> </g, '><')
            .trim();
        setRawHtml(minified);
        showToast('HTML Minified');
    };

    const copyHtml = async () => {
        if (!rawHtml.trim()) return;
        await navigator.clipboard.writeText(rawHtml);
        showToast('HTML copied to clipboard');
    };

    const shareViaPasteport = () => {
        if (!rawHtml.trim()) return;
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pasteport_prefill_text', rawHtml);
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
                                🌐 Web Markup Engine
                            </div>
                            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                                HTML Formatter & Live Preview
                            </h1>
                            <p className="text-xs text-slate-500 sm:text-sm">
                                Beautify, minify, and inspect live HTML rendering inside an isolated client-side sandbox.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={copyHtml}
                                disabled={!rawHtml.trim()}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 disabled:opacity-50"
                            >
                                📋 Copy HTML
                            </button>
                            <button
                                onClick={shareViaPasteport}
                                disabled={!rawHtml.trim()}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
                            >
                                🚀 Share via Pasteport
                            </button>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={handleBeautify}
                                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95"
                            >
                                ✨ Beautify HTML
                            </button>
                            <button
                                onClick={handleMinify}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95"
                            >
                                🗜️ Minify HTML
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50">
                                {[
                                    { id: 'split', label: 'Split' },
                                    { id: 'code', label: 'Code' },
                                    { id: 'preview', label: 'Preview' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setViewMode(tab.id as 'split' | 'code' | 'preview')}
                                        className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                                            viewMode === tab.id
                                                ? 'bg-white text-blue-700 shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <select
                                value={indentSpaces}
                                onChange={(e) => setIndentSpaces(Number(e.target.value))}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold focus:outline-none"
                            >
                                <option value={2}>2 Spaces</option>
                                <option value={4}>4 Spaces</option>
                            </select>
                        </div>
                    </div>

                    {/* Editor & Preview Area */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Editor Pane */}
                        {(viewMode === 'split' || viewMode === 'code') && (
                            <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2 ${viewMode === 'code' ? 'lg:col-span-2' : ''}`}>
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                    <span className="font-bold uppercase tracking-wider">HTML Markup</span>
                                    <span className="font-mono">{rawHtml.length} chars · {rawHtml.split('\n').length} lines</span>
                                </div>
                                <textarea
                                    value={rawHtml}
                                    onChange={(e) => setRawHtml(e.target.value)}
                                    placeholder="Type or paste HTML markup..."
                                    rows={18}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none sm:text-sm"
                                />
                            </div>
                        )}

                        {/* Live Preview Pane */}
                        {(viewMode === 'split' || viewMode === 'preview') && (
                            <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2 ${viewMode === 'preview' ? 'lg:col-span-2' : ''}`}>
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                    <span className="font-bold uppercase tracking-wider">Sandboxed Preview</span>
                                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                                        🛡️ Isolated iframe
                                    </span>
                                </div>
                                <div className="h-[420px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                                    <iframe
                                        srcDoc={rawHtml}
                                        title="HTML Live Sandbox"
                                        sandbox="allow-scripts"
                                        className="h-full w-full bg-white"
                                    />
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
