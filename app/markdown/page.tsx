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
        .replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-slate-900 mt-4 mb-1 break-words">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-lg font-extrabold text-slate-900 mt-5 mb-2 border-b border-slate-200 pb-1 break-words">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-black text-slate-900 mt-6 mb-3 border-b-2 border-slate-200 pb-2 break-words">$1</h1>')
        // Bold & Italic
        .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        // Blockquotes
        .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-blue-500 bg-blue-50/50 pl-3 py-1 my-2 text-slate-700 italic break-words">$1</blockquote>')
        // Code blocks
        .replace(/```([\s\S]*?)```/gim, '<div class="my-3 w-full max-w-full overflow-hidden rounded-xl bg-slate-900"><pre class="p-3 text-slate-100 overflow-x-auto text-xs font-mono w-full max-w-full leading-relaxed"><code>$1</code></pre></div>')
        // Inline code
        .replace(/`([^`]+)`/gim, '<code class="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded font-mono text-xs break-all">$1</code>')
        // Unordered lists
        .replace(/^\s*\-\s(.*$)/gim, '<li class="ml-4 list-disc text-slate-700 break-words">$1</li>')
        // Checklists
        .replace(/\[ \]\s(.*$)/gim, '<span class="inline-flex items-center gap-1.5 break-words"><input type="checkbox" disabled class="rounded shrink-0" /> $1</span>')
        .replace(/\[x\]\s(.*$)/gim, '<span class="inline-flex items-center gap-1.5 break-words"><input type="checkbox" checked disabled class="rounded text-blue-600 shrink-0" /> <del class="text-slate-400">$1</del></span>')
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
    const [viewMode, setViewMode] = useState<'both' | 'edit' | 'preview'>('both');

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

    const exportHtml = () => {
        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pasteport Export</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 40px auto; padding: 0 20px; }
        h1 { font-size: 2rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px; }
        h2 { font-size: 1.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 20px; }
        blockquote { border-left: 4px solid #3b82f6; background: #eff6ff; padding: 8px 16px; margin: 16px 0; color: #334155; }
        pre { background: #0f172a; color: #f8fafc; padding: 12px; border-radius: 8px; overflow-x: auto; font-family: monospace; }
        code { background: #f1f5f9; color: #db2777; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
        pre code { background: transparent; color: inherit; padding: 0; }
        li { margin-left: 20px; }
    </style>
</head>
<body>
    ${renderedHtml}
</body>
</html>`;
        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pasteport-doc.html';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Downloaded pasteport-doc.html');
    };

    const exportPdf = () => {
        if (!markdown.trim()) return;

        const printWindow = window.open('', '_blank', 'width=850,height=950');
        if (!printWindow) {
            window.print();
            return;
        }

        printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
    <title>Pasteport Document Export</title>
    <meta charset="utf-8" />
    <style>
        @page {
            margin: 20mm 15mm;
            size: A4 portrait;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            padding: 24px;
            max-width: 800px;
            margin: 0 auto;
        }
        h1 { font-size: 22pt; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px; color: #0f172a; }
        h2 { font-size: 16pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 20px; color: #0f172a; }
        h3 { font-size: 13pt; margin-top: 16px; color: #0f172a; }
        blockquote { border-left: 4px solid #3b82f6; background: #eff6ff; padding: 8px 16px; margin: 16px 0; color: #334155; font-style: italic; }
        pre { background: #0f172a; color: #f8fafc; padding: 12px; border-radius: 8px; overflow-x: auto; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 9.5pt; }
        code { background: #f1f5f9; color: #db2777; padding: 2px 6px; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 9pt; }
        pre code { background: transparent; color: inherit; padding: 0; }
        li { margin-left: 20px; margin-bottom: 4px; }
        del { color: #94a3b8; }
        @media print {
            body { padding: 0; }
        }
    </style>
</head>
<body>
    ${renderedHtml}
    <script>
        window.onload = function() {
            window.focus();
            window.print();
            setTimeout(function() { window.close(); }, 1500);
        };
    </script>
</body>
</html>`);
        printWindow.document.close();
        showToast('Preparing PDF export dialog...');
    };

    const shareViaPasteport = () => {
        if (!markdown.trim()) return;
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pasteport_prefill_text', markdown);
            router.push('/send');
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 overflow-x-hidden">
            <Navbar />

            <main className="flex-1 w-full max-w-full px-3.5 py-6 sm:px-6 sm:py-10">
                <div className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-6">
                    {/* Header */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
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

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={exportPdf}
                                disabled={!markdown.trim()}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50"
                            >
                                📄 Export PDF
                            </button>
                            <button
                                onClick={shareViaPasteport}
                                disabled={!markdown.trim()}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
                            >
                                🚀 Share via Pasteport
                            </button>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs lg:flex-row lg:items-center lg:justify-between">
                        {/* Left: View Mode Switcher & Stats */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* View Switcher */}
                            <div className="flex rounded-xl bg-slate-100 p-1">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('both')}
                                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                                        viewMode === 'both' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    <span className="hidden sm:inline">↔️ </span>Split
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('edit')}
                                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                                        viewMode === 'edit' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    ✏️ Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('preview')}
                                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                                        viewMode === 'preview' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    👁️ Preview
                                </button>
                            </div>

                            {/* Word & char counters */}
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-slate-500">
                                <span><b>{stats.words}</b> words</span>
                                <span className="text-slate-300">•</span>
                                <span><b>{stats.chars}</b> chars</span>
                                <span className="text-slate-300">•</span>
                                <span>~<b>{stats.readTime}</b>m read</span>
                            </div>
                        </div>

                        {/* Right: Action buttons */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <button
                                onClick={copyMarkdown}
                                title="Copy Markdown"
                                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95"
                            >
                                📋 <span className="hidden sm:inline">Copy </span>MD
                            </button>
                            <button
                                onClick={downloadMarkdown}
                                title="Download Markdown"
                                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95"
                            >
                                ⬇ <span className="hidden sm:inline">Download </span>.md
                            </button>
                            <button
                                onClick={exportHtml}
                                title="Export HTML"
                                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95"
                            >
                                🌐 HTML
                            </button>
                            <button
                                onClick={exportPdf}
                                title="Export PDF"
                                className="rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 active:scale-95"
                            >
                                📄 PDF
                            </button>
                            <button
                                onClick={() => setMarkdown('')}
                                title="Clear Editor"
                                className="rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 active:scale-95"
                            >
                                ✕ Clear
                            </button>
                        </div>
                    </div>

                    {/* Workspace: Split or Single View */}
                    <div className={`grid min-w-0 max-w-full gap-4 ${viewMode === 'both' ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
                        {/* Editor */}
                        {(viewMode === 'both' || viewMode === 'edit') && (
                            <div className="flex min-w-0 max-w-full flex-col space-y-1.5">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-xs font-bold text-slate-600">Markdown Source</span>
                                    <span className="text-[11px] text-slate-400">GitHub Flavored</span>
                                </div>
                                <textarea
                                    value={markdown}
                                    onChange={(e) => setMarkdown(e.target.value)}
                                    placeholder="Type markdown here..."
                                    spellCheck={false}
                                    className="h-[440px] sm:h-[500px] lg:h-[540px] w-full min-w-0 max-w-full resize-none rounded-2xl border-2 border-slate-200 bg-white p-3.5 sm:p-4 font-mono text-xs leading-relaxed text-slate-800 focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        )}

                        {/* Live Render */}
                        {(viewMode === 'both' || viewMode === 'preview') && (
                            <div className="flex min-w-0 max-w-full flex-col space-y-1.5">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-xs font-bold text-slate-600">Rendered HTML Output</span>
                                    <span className="text-[11px] font-semibold text-emerald-600">● Live Preview</span>
                                </div>
                                <div
                                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                                    className="h-[440px] sm:h-[500px] lg:h-[540px] w-full min-w-0 max-w-full overflow-y-auto overflow-x-hidden break-words rounded-2xl border-2 border-slate-200 bg-white p-4 sm:p-6 text-sm leading-relaxed text-slate-800 shadow-inner"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
