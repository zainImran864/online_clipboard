'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { showToast } from '@/lib/appEvents';

// Lightweight safe Markdown to HTML parser
function parseMarkdown(md: string): string {
    const html = md
        // Escape HTML
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Headers
        .replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-slate-900 mt-4 mb-1">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-lg font-extrabold text-slate-900 mt-5 mb-2 border-b border-slate-200 pb-1">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-black text-slate-900 mt-6 mb-3 border-b-2 border-slate-200 pb-2">$1</h1>')
        // Bold & Italic
        .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        // Blockquotes
        .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-blue-500 bg-blue-50/50 pl-3 py-1 my-2 text-slate-700 italic">$1</blockquote>')
        // Code blocks
        .replace(/```([\s\S]*?)```/gim, '<pre class="bg-slate-900 text-slate-100 p-3 my-3 rounded-xl overflow-x-auto text-xs font-mono"><code>$1</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/gim, '<code class="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded font-mono text-xs">$1</code>')
        // Unordered lists
        .replace(/^\s*\-\s(.*$)/gim, '<li class="ml-4 list-disc text-slate-700">$1</li>')
        // Checklists
        .replace(/\[ \]\s(.*$)/gim, '<span class="inline-flex items-center gap-1.5"><input type="checkbox" disabled class="rounded" /> $1</span>')
        .replace(/\[x\]\s(.*$)/gim, '<span class="inline-flex items-center gap-1.5"><input type="checkbox" checked disabled class="rounded text-blue-600" /> <del class="text-slate-400">$1</del></span>')
        // Line breaks
        .replace(/\n\n/gim, '<br /><br />')
        .replace(/\n/gim, '<br />');

    return html;
}

const SAMPLE_MARKDOWN = `# Welcome to Pasteport Markdown Editor 🚀

Pasteport offers instant **file & text sharing** with zero signup.

## Key Highlights
- **Fast:** Instant 6-digit access code
- **Secure:** 24-hour auto-purge guarantee
- **PWA:** Install on desktop or mobile device

### Code Example
\`\`\`javascript
// Fetch clip securely
const clip = await fetchClipByCode('984210');
console.log('Shared content:', clip.textContent);
\`\`\`

> "Simplicity is prerequisite for reliability." — Edsger W. Dijkstra

### Task List
[x] Create instant share code
[x] Upload documents and images
[ ] Try out Dev Utilities
`;

export default function MarkdownEditorPage() {
    const router = useRouter();
    const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);

    const renderedHtml = useMemo(() => parseMarkdown(markdown), [markdown]);

    const stats = useMemo(() => {
        const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
        const chars = markdown.length;
        const readTime = Math.ceil(words / 200);
        return { words, chars, readTime };
    }, [markdown]);

    const copyMarkdown = async () => {
        await navigator.clipboard.writeText(markdown);
        showToast('Markdown copied to clipboard');
    };

    const downloadMarkdown = () => {
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pasteport-doc.md';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Downloaded pasteport-doc.md');
    };

    const shareViaPasteport = () => {
        if (!markdown.trim()) return;
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pasteport_prefill_text', markdown);
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
                                📝 Developer Utility
                            </div>
                            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                                Live Markdown Preview & Editor
                            </h1>
                            <p className="text-xs text-slate-500 sm:text-sm">
                                Write formatted notes, technical docs, and README files with instant live rendering and export.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={shareViaPasteport}
                                disabled={!markdown.trim()}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
                            >
                                🚀 Share via Pasteport
                            </button>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
                        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                            <span><b>{stats.words}</b> words</span>
                            <span><b>{stats.chars}</b> characters</span>
                            <span>~<b>{stats.readTime}</b> min read</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={copyMarkdown}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95"
                            >
                                📋 Copy Markdown
                            </button>
                            <button
                                onClick={downloadMarkdown}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95"
                            >
                                ⬇ Download .md
                            </button>
                            <button
                                onClick={() => setMarkdown('')}
                                className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 active:scale-95"
                            >
                                ✕ Clear
                            </button>
                        </div>
                    </div>

                    {/* Split Editor */}
                    <div className="grid gap-4 lg:grid-cols-2">
                        {/* Editor */}
                        <div className="space-y-1.5">
                            <span className="text-xs font-bold text-slate-600">Markdown Source</span>
                            <textarea
                                value={markdown}
                                onChange={(e) => setMarkdown(e.target.value)}
                                placeholder="Type markdown here..."
                                spellCheck={false}
                                className="h-[520px] w-full rounded-2xl border-2 border-slate-200 bg-white p-4 font-mono text-xs leading-relaxed text-slate-800 focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        {/* Live Render */}
                        <div className="space-y-1.5">
                            <span className="text-xs font-bold text-slate-600">Rendered HTML Output</span>
                            <div
                                dangerouslySetInnerHTML={{ __html: renderedHtml }}
                                className="h-[520px] w-full overflow-auto rounded-2xl border-2 border-slate-200 bg-white p-6 text-sm text-slate-800 leading-relaxed shadow-inner"
                            />
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
