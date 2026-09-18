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
        { href: '/diff', name: 'Diff Checker', icon: '🔍', desc: 'Compare code, text & JSON differences' },
        { href: '/jwt', name: 'JWT Debugger & Decoder', icon: '🔐', desc: 'Inspect header & payload claims locally' },
        { href: '/encode', name: 'Base64 & URL Encoder', icon: '🔄', desc: 'Convert text, tokens & files to Base64' },
        { href: '/markdown', name: 'Markdown Live Preview', icon: '📝', desc: 'Split-screen live markdown editor' },
    ];

    const isToolActive = devTools.some(tool => pathname.startsWith(tool.href));

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
                            <div className="absolute right-0 top-full pt-2 animate-fadeIn">
                                <div className="w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                                    <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                        Client-Side Utilities
                                    </div>
                                    {devTools.map((tool) => (
                                        <Link
                                            key={tool.href}
                                            href={tool.href}
                                            onClick={() => setToolsOpen(false)}
                                            className={`flex items-start gap-2.5 rounded-xl p-2.5 transition-colors ${
                                                pathname === tool.href
                                                    ? 'bg-blue-50 text-blue-900'
                                                    : 'hover:bg-slate-50 text-slate-700'
                                            }`}
                                        >
                                            <span className="text-lg">{tool.icon}</span>
                                            <div>
                                                <p className="text-xs font-bold">{tool.name}</p>
                                                <p className="text-[11px] text-slate-400">{tool.desc}</p>
                                            </div>
                                        </Link>
                                    ))}
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
                        <p className="px-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Developer Tools
                        </p>
                        <div className="mt-1 space-y-1">
                            {devTools.map((tool) => (
                                <Link
                                    key={tool.href}
                                    href={tool.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
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
