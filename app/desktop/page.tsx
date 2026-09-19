'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { showToast } from '@/lib/appEvents';

const PLATFORMS = [
    {
        id: 'windows',
        name: 'Windows',
        icon: '🪟',
        version: 'v1.0.0 (64-bit)',
        badge: 'Installer + Portable',
        filename: 'Pasteport-Setup-1.0.0.exe',
        desc: 'Windows 10, 11 (x64 / ARM64). Includes NSIS installer & single-file portable EXE.',
        command: 'winget install pasteport',
    },
    {
        id: 'macos',
        name: 'macOS',
        icon: '🍎',
        version: 'v1.0.0 Universal',
        badge: 'Apple Silicon & Intel',
        filename: 'Pasteport-1.0.0.dmg',
        desc: 'macOS 12 Monterey or newer. Native support for M1/M2/M3/M4 and Intel chips.',
        command: 'brew install --cask pasteport',
    },
    {
        id: 'linux',
        name: 'Linux',
        icon: '🐧',
        version: 'v1.0.0 (.AppImage & .deb)',
        badge: 'Universal AppImage',
        filename: 'Pasteport-1.0.0.AppImage',
        desc: 'Ubuntu, Debian, Fedora, Arch Linux. Standalone AppImage and Debian package.',
        command: 'sudo apt install ./pasteport.deb',
    },
];

const FEATURES = [
    {
        icon: '⌨️',
        title: 'Global Hotkey (Ctrl + Shift + P)',
        desc: 'Summon the quick-share HUD popup from any application on your system without switching windows.',
    },
    {
        icon: '📋',
        title: 'Instant Clipboard Sharing',
        desc: 'Automatically reads current clipboard text or links and generates a 6-digit share code in under 200ms.',
    },
    {
        icon: '🔔',
        title: 'Native OS Notifications',
        desc: 'Receive non-intrusive system notifications in Windows Action Center or macOS Notification Center with direct link copying.',
    },
    {
        icon: '👁️',
        title: 'Background Clipboard Monitor',
        desc: 'Optional feather-light daemon (<40MB RAM) that watches for new clipboard items and offers quick 1-click cloud sync.',
    },
    {
        icon: '🔒',
        title: 'PIN Locking & Self-Destruct',
        desc: 'Protect desktop clips with 4-character PINs or self-destruct countdowns before sending to the cloud.',
    },
    {
        icon: '🛠️',
        title: 'All 18 Developer Utilities',
        desc: 'Enjoy Regex, UUID, JWT, SQL Formatter, Hash, and Cron generators in a dedicated desktop window without browser tab clutter.',
    },
];

export default function DesktopPage() {
    const [selectedTab, setSelectedTab] = useState<'windows' | 'macos' | 'linux'>('windows');
    const [simulatedHotkeyActive, setSimulatedHotkeyActive] = useState<boolean>(false);
    const [simulatedCopied, setSimulatedCopied] = useState<boolean>(false);

    const copyText = async (text: string, label = 'Copied') => {
        await navigator.clipboard.writeText(text);
        showToast(`${label} copied to clipboard`);
    };

    const triggerSimulatedHotkey = () => {
        setSimulatedHotkeyActive(true);
        setSimulatedCopied(false);
        setTimeout(() => {
            setSimulatedCopied(true);
            showToast('Simulated: Clip uploaded! Share Code: 894215');
        }, 1200);
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Navbar />

            <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12">
                <div className="mx-auto max-w-5xl space-y-12">
                    {/* Hero Section */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-extrabold text-blue-700 shadow-2xs">
                            🖥️ Native Desktop Experience
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
                            Pasteport for Desktop
                        </h1>
                        <p className="mx-auto max-w-2xl text-sm font-medium text-slate-600 sm:text-base">
                            The fastest way to beam your clipboard to any device. Featuring global hotkeys,
                            background tray daemon, clipboard monitoring, and native notifications.
                        </p>

                        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                            <a
                                href="#downloads"
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95"
                            >
                                📥 Download for {selectedTab === 'windows' ? 'Windows' : selectedTab === 'macos' ? 'macOS' : 'Linux'}
                            </a>
                            <button
                                onClick={triggerSimulatedHotkey}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95"
                            >
                                ⚡ Test Global Hotkey
                            </button>
                        </div>
                    </div>

                    {/* Interactive Hotkey Simulation HUD */}
                    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-8 text-white shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
                            <div>
                                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-400">
                                    Interactive Workflow Demo
                                </span>
                                <h2 className="text-lg font-bold text-white sm:text-xl">
                                    Press <kbd className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 font-mono text-xs text-blue-300">Ctrl + Shift + P</kbd> Anywhere
                                </h2>
                            </div>
                            <button
                                onClick={triggerSimulatedHotkey}
                                className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 active:scale-95 transition-all"
                            >
                                Simulate Hotkey Press
                            </button>
                        </div>

                        <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-center">
                            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
                                <p>
                                    Whether you are inside VS Code, terminal, Figma, or a browser, the global shortcut summons the quick-share HUD without interrupting your focus.
                                </p>
                                <ul className="space-y-2 font-mono text-xs">
                                    <li className="flex items-center gap-2 text-emerald-400">
                                        <span>✔</span> Auto-detects active clipboard content
                                    </li>
                                    <li className="flex items-center gap-2 text-emerald-400">
                                        <span>✔</span> Beams securely to Pasteport cloud in 200ms
                                    </li>
                                    <li className="flex items-center gap-2 text-emerald-400">
                                        <span>✔</span> Copies direct view link back to clipboard immediately
                                    </li>
                                </ul>
                            </div>

                            {/* HUD Mini Window Mockup */}
                            <div className="rounded-2xl border border-slate-700 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-md space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-xs font-extrabold text-blue-400">
                                        <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
                                        ⚡ QUICK SHARE HUD
                                    </span>
                                    <span className="font-mono text-[10px] text-slate-500">Ctrl+Shift+P</span>
                                </div>

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-300">
                                    {simulatedHotkeyActive
                                        ? simulatedCopied
                                            ? '🚀 Uploaded! Share Code: 894215\nURL: https://pasteport.zain-imran.com/view/894215'
                                            : 'Uploading clipboard content to Pasteport cloud...'
                                        : 'const greeting = "Hello from Pasteport Desktop!";'}
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-[11px] text-slate-400">
                                        {simulatedCopied ? 'Link copied to clipboard!' : 'Ready to beam'}
                                    </span>
                                    <span className="rounded-lg bg-blue-600/20 px-2.5 py-1 font-mono text-xs font-bold text-blue-400 border border-blue-500/30">
                                        {simulatedCopied ? 'Code: 894215' : 'Press to Send'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Download OS Cards */}
                    <div id="downloads" className="space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">
                                Download Pasteport for Your OS
                            </h2>
                            <p className="text-xs text-slate-500 sm:text-sm">
                                Verified cross-platform builds for Windows, macOS, and Linux.
                            </p>
                        </div>

                        {/* OS Tabs */}
                        <div className="flex justify-center">
                            <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs">
                                {PLATFORMS.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedTab(p.id as 'windows' | 'macos' | 'linux')}
                                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all sm:text-sm ${
                                            selectedTab === p.id
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        <span>{p.icon}</span>
                                        <span>{p.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Active Platform Card */}
                        {PLATFORMS.filter((p) => p.id === selectedTab).map((p) => (
                            <div
                                key={p.id}
                                className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                                            {p.icon}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-black text-slate-900">{p.name}</h3>
                                                <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                                                    {p.badge}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{p.desc}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => copyText(p.filename, 'Installer name')}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-105 active:scale-95"
                                        >
                                            📥 Download {p.filename}
                                        </button>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                                    <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                                        <span>Or install via terminal:</span>
                                        <button
                                            onClick={() => copyText(p.command, 'Install command')}
                                            className="text-blue-600 hover:text-blue-800 font-semibold"
                                        >
                                            Copy Command
                                        </button>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs font-bold text-slate-800 break-all select-all">
                                        $ {p.command}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Feature Grid */}
                    <div className="space-y-6">
                        <div className="text-center space-y-1">
                            <h2 className="text-2xl font-black text-slate-900">
                                Engineered for Peak Productivity
                            </h2>
                            <p className="text-xs text-slate-500 sm:text-sm">
                                Everything you need to share, sync, and format without browser friction.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {FEATURES.map((feat) => (
                                <div
                                    key={feat.title}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2 transition-all hover:border-blue-300 hover:shadow-md"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xl">
                                        {feat.icon}
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900">{feat.title}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
