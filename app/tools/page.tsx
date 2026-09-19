'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export interface DevToolItem {
    href: string;
    name: string;
    icon: string;
    category: 'Formatters' | 'Security' | 'Web & HTTP' | 'Generators' | 'Native & CLI';
    desc: string;
    tags: string[];
}

export const ALL_DEV_TOOLS: DevToolItem[] = [
    {
        href: '/json',
        name: 'JSON Formatter & Tree',
        icon: '🌲',
        category: 'Formatters',
        desc: 'Auto-beautify, minify, validate, and explore nested JSON payloads with zero server transmission.',
        tags: ['json', 'format', 'beautify', 'minify', 'tree', 'validate'],
    },
    {
        href: '/yaml',
        name: 'YAML ↔ JSON Converter',
        icon: '📑',
        category: 'Formatters',
        desc: 'Convert seamlessly between YAML and JSON formats with live syntax error indicators.',
        tags: ['yaml', 'json', 'convert', 'docker', 'kubernetes'],
    },
    {
        href: '/sql',
        name: 'SQL Formatter & Beautifier',
        icon: '🗄️',
        category: 'Formatters',
        desc: 'Beautify messy SQL queries, uppercase keywords, and clean up indentation client-side.',
        tags: ['sql', 'database', 'format', 'beautify', 'postgres', 'mysql'],
    },
    {
        href: '/html',
        name: 'HTML Formatter & Preview',
        icon: '🌐',
        category: 'Formatters',
        desc: 'Beautify or minify HTML markup and inspect live rendering inside an isolated sandbox.',
        tags: ['html', 'format', 'minify', 'sandbox', 'preview'],
    },
    {
        href: '/diff',
        name: 'Diff Checker',
        icon: '🔍',
        category: 'Formatters',
        desc: 'Compare text and code changes side-by-side or unified with syntax change highlighting.',
        tags: ['diff', 'compare', 'merge', 'git', 'changes'],
    },
    {
        href: '/markdown',
        name: 'Markdown Live Editor',
        icon: '📝',
        category: 'Formatters',
        desc: 'Split-screen live markdown editor with GitHub Flavored Markdown and PDF/HTML export.',
        tags: ['markdown', 'gfm', 'pdf', 'editor', 'preview'],
    },
    {
        href: '/encode',
        name: 'Base64 & URL Converter',
        icon: '🔄',
        category: 'Formatters',
        desc: 'Encode and decode strings, query parameters, and binary files into Data URIs in browser memory.',
        tags: ['base64', 'url', 'encode', 'decode', 'data uri'],
    },
    {
        href: '/regex',
        name: 'Regex Tester & Matcher',
        icon: '⚡',
        category: 'Generators',
        desc: 'Test regular expressions in real time with capture groups inspector and common regex presets.',
        tags: ['regex', 'regular expression', 'tester', 'matcher', 'groups'],
    },
    {
        href: '/uuid',
        name: 'UUID & GUID Generator',
        icon: '🎲',
        category: 'Generators',
        desc: 'Generate RFC 4122 (v4 random) and RFC 9562 (v7 time-ordered) UUIDs in bulk.',
        tags: ['uuid', 'guid', 'v4', 'v7', 'random', 'id'],
    },
    {
        href: '/timestamp',
        name: 'Unix Timestamp Converter',
        icon: '⏱️',
        category: 'Generators',
        desc: 'Convert Unix epoch timestamps to human readable dates, ISO-8601, and relative times.',
        tags: ['timestamp', 'epoch', 'date', 'time', 'unix'],
    },
    {
        href: '/cron',
        name: 'Cron Schedule Generator',
        icon: '⏰',
        category: 'Generators',
        desc: 'Build, decode, and calculate upcoming execution dates for standard 5-field cron schedules.',
        tags: ['cron', 'schedule', 'job', 'timer', 'crontab'],
    },
    {
        href: '/lorem',
        name: 'Lorem Ipsum & Mock JSON',
        icon: '📦',
        category: 'Generators',
        desc: 'Generate placeholder text, sentences, or structured mock JSON data for development.',
        tags: ['lorem', 'ipsum', 'mock', 'dummy', 'json', 'data'],
    },
    {
        href: '/jwt',
        name: 'JWT Debugger & Decoder',
        icon: '🔐',
        category: 'Security',
        desc: 'Inspect header and payload claims with live expiration countdowns without transmitting secrets.',
        tags: ['jwt', 'token', 'decode', 'auth', 'claims'],
    },
    {
        href: '/jwt-gen',
        name: 'JWT Generator & Signer',
        icon: '✍️',
        category: 'Security',
        desc: 'Construct and sign HMAC-SHA256 JWT tokens using browser Web Crypto APIs.',
        tags: ['jwt', 'generate', 'sign', 'hmac', 'sha256'],
    },
    {
        href: '/hash',
        name: 'Hash & Checksum Generator',
        icon: '🛡️',
        category: 'Security',
        desc: 'Compute MD5, SHA-1, SHA-256, SHA-512, and HMAC signatures for text and local files.',
        tags: ['hash', 'md5', 'sha256', 'sha512', 'checksum', 'hmac'],
    },
    {
        href: '/url',
        name: 'URL Parser & Query Editor',
        icon: '🔗',
        category: 'Web & HTTP',
        desc: 'Deconstruct URLs, inspect and live-edit query parameters, and encode components safely.',
        tags: ['url', 'query', 'params', 'uri', 'search'],
    },
    {
        href: '/http-status',
        name: 'HTTP Status Code Reference',
        icon: '📖',
        category: 'Web & HTTP',
        desc: 'Fast, searchable encyclopedia of standard RFC and Cloudflare HTTP status codes.',
        tags: ['http', 'status', 'codes', '404', '500', 'reference'],
    },
    {
        href: '/color',
        name: 'Color Converter & Contrast',
        icon: '🎨',
        category: 'Web & HTTP',
        desc: 'Convert HEX, RGB, HSL color codes and calculate WCAG 2.1 accessibility contrast ratios.',
        tags: ['color', 'hex', 'rgb', 'hsl', 'contrast', 'wcag'],
    },
    {
        href: '/desktop',
        name: 'Pasteport Desktop App',
        icon: '🖥️',
        category: 'Native & CLI',
        desc: 'Cross-platform app for Windows, macOS, and Linux with global hotkey (Ctrl+Shift+P) and tray daemon.',
        tags: ['desktop', 'electron', 'windows', 'macos', 'linux', 'hotkey', 'native', 'daemon', 'system tray'],
    },
    {
        href: '/cli',
        name: 'Pasteport CLI Tool',
        icon: '⚡',
        category: 'Native & CLI',
        desc: 'Zero-dependency command-line interface. Pipe terminal outputs, upload zip archives, and script sharing.',
        tags: ['cli', 'terminal', 'bash', 'npm', 'pipeline', 'developer', 'command', 'piping', 'automation'],
    },
];

export default function ToolsDirectoryPage() {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const filteredTools = useMemo(() => {
        return ALL_DEV_TOOLS.filter((tool) => {
            const matchesCategory =
                selectedCategory === 'All' || tool.category === selectedCategory;
            const q = search.toLowerCase().trim();
            const matchesSearch =
                !q ||
                tool.name.toLowerCase().includes(q) ||
                tool.desc.toLowerCase().includes(q) ||
                tool.tags.some((t) => t.toLowerCase().includes(q));
            return matchesCategory && matchesSearch;
        });
    }, [search, selectedCategory]);

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Navbar />

            <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12">
                <div className="mx-auto max-w-6xl space-y-8">
                    {/* Hero */}
                    <div className="text-center space-y-4">
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-bold text-slate-700 shadow-xs">
                            🛠️ Developer Toolkit Suite · 100% Client-Side Privacy
                        </span>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
                            Developer Utilities & Workflow Tools
                        </h1>
                        <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base">
                            Fast, privacy-first web utilities with zero server transmission. Every tool connects directly to Pasteport for instant 1-click cross-device sharing.
                        </p>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search all 18 developer utilities (e.g. json, regex, hash, uuid)..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none sm:text-sm"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Category Filter Pills */}
                        <div className="flex flex-wrap gap-1.5">
                            {['All', 'Native & CLI', 'Formatters', 'Security', 'Generators', 'Web & HTTP'].map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                                        selectedCategory === cat
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tools Grid */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredTools.length === 0 ? (
                            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
                                No developer utilities found matching &quot;{search}&quot;.
                            </div>
                        ) : (
                            filteredTools.map((tool) => (
                                <Link
                                    key={tool.href}
                                    href={tool.href}
                                    className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-2xl transition-transform group-hover:scale-110">
                                                {tool.icon}
                                            </span>
                                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                {tool.category}
                                            </span>
                                        </div>

                                        <div>
                                            <h2 className="text-base font-bold text-slate-900 group-hover:text-blue-600">
                                                {tool.name}
                                            </h2>
                                            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                                                {tool.desc}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-blue-600">
                                        <span>Open Tool</span>
                                        <span className="transition-transform group-hover:translate-x-1">→</span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
