'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';

export default function Navbar() {
    const pathname = usePathname();
    const [toolsOpen, setToolsOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const devTools = [
        { href: '/json', name: 'JSON Formatter & Tree', icon: '🌲', desc: 'Beautify, validate & inspect JSON' },
        { href: '/yaml', name: 'YAML ↔ JSON Converter', icon: '📑', desc: 'Bi-directional YAML & JSON' },
        { href: '/sql', name: 'SQL Formatter', icon: '🗄️', desc: 'Clean, format & uppercase SQL' },
        { href: '/regex', name: 'Regex Tester', icon: '⚡', desc: 'Test patterns & inspect groups' },
        { href: '/uuid', name: 'UUID Generator (v4/v7)', icon: '🎲', desc: 'RFC compliant UUIDs & GUIDs' },
        { href: '/timestamp', name: 'Unix Timestamp Converter', icon: '⏱️', desc: 'Epoch to human dates & relative' },
        { href: '/jwt', name: 'JWT Debugger', icon: '🔐', desc: 'Inspect header & claims' },
        { href: '/jwt-gen', name: 'JWT Generator', icon: '✍️', desc: 'Sign HMAC tokens in-browser' },
        { href: '/hash', name: 'Hash & Checksum', icon: '🛡️', desc: 'MD5, SHA-256, SHA-512, HMAC' },
        { href: '/url', name: 'URL Parser & Params', icon: '🔗', desc: 'Deconstruct & edit queries' },
        { href: '/http-status', name: 'HTTP Status Reference', icon: '📖', desc: 'RFC & Cloudflare status codes' },
        { href: '/color', name: 'Color Converter & WCAG', icon: '🎨', desc: 'HEX, RGB, HSL & contrast' },
        { href: '/html', name: 'HTML Formatter & Preview', icon: '🌐', desc: 'Beautify & sandbox preview' },
        { href: '/diff', name: 'Diff Checker', icon: '🔍', desc: 'Compare code & text changes' },
        { href: '/encode', name: 'Base64 & URL Encoder', icon: '🔄', desc: 'Text & binary to Base64' },
        { href: '/markdown', name: 'Markdown Live Preview', icon: '📝', desc: 'Live preview with PDF export' },
        { href: '/cron', name: 'Cron Expression Generator', icon: '⏰', desc: 'Build & explain schedules' },
        { href: '/lorem', name: 'Lorem & Dummy JSON', icon: '📦', desc: 'Mock text & JSON generator' },
    ];

    const isToolActive = pathname === '/tools' || devTools.some(tool => pathname.startsWith(tool.href));

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
                <Link href="/" className="transition-opacity hover:opacity-90">
                    <Logo size={36} />
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden items-center gap-1 md:flex">
                    <Link
                        href="/send"
                        className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                            pathname === '/send'
                                ? 'bg-blue-50 text-blue-700 shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                        }`}
                    >
                        📤 Send File
                    </Link>
                    <Link
                        href="/read"
                        className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                            pathname === '/read'
                                ? 'bg-blue-50 text-blue-700 shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                        }`}
                    >
                        📥 Read File
                    </Link>
                    <Link
                        href="/secure"
                        className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                            pathname === '/secure'
                                ? 'bg-purple-50 text-purple-700 shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                        }`}
                    >
                        🔒 Secret Share
                    </Link>

                    {/* Developer Tools Dropdown */}
                    <div
                        className="relative"
                        onMouseEnter={() => setToolsOpen(true)}
                        onMouseLeave={() => setToolsOpen(false)}
                    >
                        <button
                            onClick={() => setToolsOpen(!toolsOpen)}
                            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                                isToolActive
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-700 hover:bg-slate-100/70'
                            }`}
                        >
                            <span>🛠️ Dev Tools</span>
                            <span className="rounded-full bg-blue-100/80 px-1.5 py-0.2 text-[10px] font-bold text-blue-900">
                                18
                            </span>
                            <svg
                                className={`h-3.5 w-3.5 transition-transform ${toolsOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {toolsOpen && (
                            <div className="absolute right-0 top-full pt-2 animate-fadeIn z-50">
                                <div className="w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                                    <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                        <span>18 Client-Side Utilities</span>
                                        <Link
                                            href="/tools"
                                            onClick={() => setToolsOpen(false)}
                                            className="text-blue-600 hover:underline"
                                        >
                                            View All →
                                        </Link>
                                    </div>

                                    <div className="max-h-96 overflow-y-auto space-y-0.5 pr-1">
                                        {devTools.map((tool) => (
                                            <Link
                                                key={tool.href}
                                                href={tool.href}
                                                onClick={() => setToolsOpen(false)}
                                                className={`flex items-start gap-2.5 rounded-xl p-2 transition-colors ${
                                                    pathname === tool.href
                                                        ? 'bg-blue-50 text-blue-900'
                                                        : 'hover:bg-slate-50 text-slate-700'
                                                }`}
                                            >
                                                <span className="text-base">{tool.icon}</span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold truncate">{tool.name}</p>
                                                    <p className="text-[10px] text-slate-400 truncate">{tool.desc}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>

                                    <div className="border-t border-slate-100 p-1.5 mt-1 text-center">
                                        <Link
                                            href="/tools"
                                            onClick={() => setToolsOpen(false)}
                                            className="block rounded-xl bg-slate-50 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                                        >
                                            Explore All 18 Dev Tools Hub 🚀
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 md:hidden"
                    aria-label="Toggle navigation menu"
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {mobileMenuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Mobile Navigation Drawer */}
            {mobileMenuOpen && (
                <div className="border-t border-slate-200 bg-white p-4 md:hidden animate-fadeIn space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                        <Link
                            href="/send"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                        >
                            <span className="text-lg">📤</span>
                            <span>Send</span>
                        </Link>
                        <Link
                            href="/read"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                        >
                            <span className="text-lg">📥</span>
                            <span>Read</span>
                        </Link>
                        <Link
                            href="/secure"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex flex-col items-center justify-center rounded-xl border border-purple-100 bg-purple-50/50 p-2.5 text-center text-xs font-bold text-purple-700 hover:bg-purple-100"
                        >
                            <span className="text-lg">🔒</span>
                            <span>Secret</span>
                        </Link>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between px-1 mb-1">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                18 Developer Tools
                            </p>
                            <Link
                                href="/tools"
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-[11px] font-bold text-blue-600 hover:underline"
                            >
                                View Hub →
                            </Link>
                        </div>
                        <div className="mt-1 max-h-60 overflow-y-auto space-y-1 pr-1">
                            {devTools.map((tool) => (
                                <Link
                                    key={tool.href}
                                    href={tool.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                >
                                    <span>{tool.icon}</span>
                                    <span>{tool.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
