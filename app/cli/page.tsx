'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { showToast } from '@/lib/appEvents';

const CLI_TABS = [
    {
        id: 'menu',
        label: 'Interactive Mode (Options 1, 2, 3, 4)',
        command: 'pasteport',
        title: 'Interactive Terminal Menu',
        desc: 'Run pasteport with no arguments to enter the guided interactive menu with options 1, 2, 3, and 4.',
        terminalContent: `
  ██████╗  █████╗ ███████╗████████╗███████╗██████╗  ██████╗ ██████╗ ████████╗
  ██╔══██╗██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝
  ██████╔╝███████║███████╗   ██║   █████╗  ██████╔╝██║   ██║██████╔╝   ██║   
  ██╔═══╝ ██╔══██║╚════██║   ██║   ██╔══╝  ██╔═══╝ ██║   ██║██╔══██╗   ██║   
  ██║     ██║  ██║███████║   ██║   ███████╗██║     ╚██████╔╝██║  ██║   ██║   
  ╚═╝     ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   
  Cross-device sharing + Developer Toolkit | v1.0.1

Select an action by typing 1, 2, 3, or 4:

  [1] Standard Share  — Send text snippet or file (up to 10 MB)
  [2] Secret Share    — Send large file (up to 600 MB via 8-digit Code)
  [3] Retrieve / Get  — View text or download file (Code or Web URL)
  [4] Delete / Wipe   — Permanently destroy a clip with Self-Destruct PIN
  [5] Exit

Choose option [1-5]: 1
── [Option 1] Standard Share (up to 10 MB) ──
Enter text content or path to a local file: ./notes.txt
Optional 4-character PIN lock (press Enter to skip): pass
Lifespan in hours [default: 24]: 12

✔ Clip Created Successfully!
──────────────────────────────────────────────
  Share Code:  591823
  Direct Link: https://pasteport.zain-imran.com/view/591823
  Type:        File (notes.txt)
  Expires:     12 hours
  Access PIN:  Locked with 4-character PIN
──────────────────────────────────────────────`,
    },
    {
        id: 'get-url',
        label: 'Download Web Link or Code',
        command: 'pasteport get https://pasteport.zain-imran.com/view/482193 -o ./archive.zip',
        title: 'Download via Web Link or Code',
        desc: 'Created a link on the website? Paste the full link or 6-digit code directly into your terminal to download files or view text.',
        terminalContent: `$ pasteport get https://pasteport.zain-imran.com/view/482193 -o ./archive.zip
Looking up clip "482193" on https://pasteport.zain-imran.com...

── File Clip [Code: 482193] ───────────────────
  Filename: archive.zip
  Size:     8450.2 KB (8.25 MB)
  Storage:  Cloudflare R2 Object
  Direct:   https://pub-r2.pasteport.dev/archive.zip
──────────────────────────────────────────────
Downloading archive.zip to ./archive.zip...
✔ Download complete: C:\\work\\archive.zip`,
    },
    {
        id: 'secret',
        label: 'Secret Share (600 MB)',
        command: 'pasteport secret 88392014 ./release.zip',
        title: 'Secret Share — Direct-to-R2 (600 MB)',
        desc: 'Need to transfer files over 10 MB? Mint an 8-digit Secret Access Code on the web (/secure) and stream up to 600 MB directly to Cloudflare R2.',
        terminalContent: `$ pasteport secret 88392014 ./release.zip
Step 1/3: Authorizing secret access code 88392014...
Step 2/3: Streaming release.zip (485.4 MB) directly to Cloudflare R2...
Step 3/3: Finalizing upload and generating Send Code...

✔ Secret Share Upload Complete!
──────────────────────────────────────────────
  Secret Send Code: 99482153
  Direct Link:      https://pasteport.zain-imran.com/secure?code=99482153
  File Uploaded:    release.zip (485.4 MB)
  Lifespan:         6 hours (auto-purged from R2 afterwards)
──────────────────────────────────────────────
The recipient can download via browser or terminal:
  pasteport get 99482153 -o ./release.zip
  pasteport get https://pasteport.zain-imran.com/secure?code=99482153 -o ./release.zip`,
    },
    {
        id: 'pipe',
        label: 'Piping & CI/CD Logs',
        command: 'git diff | pasteport send --expiry 6',
        title: 'Piping Terminal Outputs & Git Diffs',
        desc: 'Pipe anything from stdin directly into Pasteport. No temporary files required.',
        terminalContent: `$ git diff | pasteport send --expiry 6

✔ Clip Created Successfully!
──────────────────────────────────────────────
  Share Code:  719302
  Direct Link: https://pasteport.zain-imran.com/view/719302
  Type:        Text snippet (142 lines)
  Expires:     6 hours
──────────────────────────────────────────────
Retrieve anytime with: pasteport get 719302`,
    },
    {
        id: 'delete',
        label: 'Delete & Wipe Clip',
        command: 'pasteport delete 591823 --pin pass',
        title: 'Self-Destruct Wipe from Terminal',
        desc: 'Permanently destroy a clip and purge associated Cloudflare R2 storage objects immediately.',
        terminalContent: `$ pasteport delete 591823 --pin pass
Requesting permanent deletion for clip "591823"...

✔ Clip "591823" Permanently Destroyed!
Metadata in Firestore and associated Cloudflare R2 objects wiped instantly.`,
    },
];

const INSTALL_COMMANDS = [
    {
        title: 'Install via NPM',
        subtitle: 'Global installation via standard Node package manager.',
        cmd: 'npm install -g pasteport-zisphere',
        type: 'npm',
    },
    {
        title: 'Install via PNPM',
        subtitle: 'Fast, disk space efficient global installation.',
        cmd: 'pnpm add -g pasteport-zisphere',
        type: 'pnpm',
    },
    {
        title: 'Install via Bun',
        subtitle: 'Lightning-fast native global install with Bun runtime.',
        cmd: 'bun add -g pasteport-zisphere',
        type: 'bun',
    },
    {
        title: 'Install via Python PIP',
        subtitle: 'Pure Python package with zero external dependencies.',
        cmd: 'pip install pasteport-zisphere',
        type: 'pip',
    },
    {
        title: 'Run Instantly (NPX / Bunx / PNPM)',
        subtitle: 'Zero permanent install required. Executes in memory.',
        cmd: 'npx pasteport-zisphere send "hello world"',
        type: 'npx',
    },
    {
        title: 'Install from Local Source (Node & Python)',
        subtitle: 'Use immediately before public registry publication.',
        cmd: 'npm install -g ./cli  # or: pip install ./python',
        type: 'local',
    },
    {
        title: 'Publish to Public Registries',
        subtitle: 'Publish to npmjs.org and PyPI for global availability.',
        cmd: 'cd cli && npm publish --access public',
        type: 'publish',
    },
    {
        title: 'Delete a Clip from Terminal',
        subtitle: 'Trigger instant self-destruct wipe on Firestore and R2 objects.',
        cmd: 'pasteport delete <code> --pin <optional-pin>',
        type: 'delete',
    },
];

const UNINSTALL_COMMANDS = [
    {
        title: 'Uninstall from NPM',
        desc: 'Removes globally installed npm package.',
        cmd: 'npm uninstall -g pasteport-zisphere',
    },
    {
        title: 'Uninstall from PNPM',
        desc: 'Removes global pnpm binary.',
        cmd: 'pnpm remove -g pasteport-zisphere',
    },
    {
        title: 'Uninstall from Bun',
        desc: 'Removes global bun package.',
        cmd: 'bun remove -g pasteport-zisphere',
    },
    {
        title: 'Uninstall from Python PIP',
        desc: 'Removes python pip entry point.',
        cmd: 'pip uninstall -y pasteport-zisphere',
    },
    {
        title: 'Uninstall via Windows Winget',
        desc: 'Removes Windows package manager installation.',
        cmd: 'winget uninstall pasteport-zisphere',
    },
    {
        title: 'Debian / Ubuntu Linux (APT)',
        desc: 'Removes deb package from system.',
        cmd: 'sudo apt remove pasteport',
    },
    {
        title: 'Fedora / RHEL / Oracle Linux (DNF)',
        desc: 'Removes rpm package on RedHat & Oracle Linux.',
        cmd: 'sudo dnf remove pasteport',
    },
    {
        title: 'openSUSE / SUSE Linux (Zypper)',
        desc: 'Removes package via zypper manager.',
        cmd: 'sudo zypper remove pasteport',
    },
];

const TIERS = [
    {
        title: 'Option 1: Standard Share',
        size: 'Up to 10 MB',
        auth: 'No code required (100% free & open)',
        dest: 'Firestore + Cloudflare R2',
        cli: 'pasteport send [text|file]',
        expiry: '1 to 24 hours (customizable)',
        color: 'border-blue-200 bg-blue-50/50 text-blue-900',
    },
    {
        title: 'Option 2: Secret Share',
        size: 'Up to 600 MB',
        auth: 'Requires 8-digit Secret Access Code',
        dest: 'Direct-to-R2 Presigned Stream',
        cli: 'pasteport secret <code> <file>',
        expiry: '6 hours (strict auto-purge)',
        color: 'border-purple-200 bg-purple-50/50 text-purple-900',
    },
];

type PkgType = 'npm' | 'pnpm' | 'bun' | 'pip' | 'local';

const PKG_CONFIGS: Record<PkgType, { name: string; icon: string; installCmd: string; execCmd: string; uninstallCmd: string }> = {
    npm: {
        name: 'npm',
        icon: '📦',
        installCmd: 'npm install -g pasteport-zisphere',
        execCmd: 'npx pasteport-zisphere',
        uninstallCmd: 'npm uninstall -g pasteport-zisphere',
    },
    pnpm: {
        name: 'pnpm',
        icon: '⚡',
        installCmd: 'pnpm add -g pasteport-zisphere',
        execCmd: 'pnpm dlx pasteport-zisphere',
        uninstallCmd: 'pnpm remove -g pasteport-zisphere',
    },
    bun: {
        name: 'bun',
        icon: '🥟',
        installCmd: 'bun add -g pasteport-zisphere',
        execCmd: 'bunx pasteport-zisphere',
        uninstallCmd: 'bun remove -g pasteport-zisphere',
    },
    pip: {
        name: 'pip (Python)',
        icon: '🐍',
        installCmd: 'pip install pasteport-zisphere',
        execCmd: 'pasteport',
        uninstallCmd: 'pip uninstall pasteport-zisphere',
    },
    local: {
        name: 'local source',
        icon: '🛠️',
        installCmd: 'npm install -g ./cli',
        execCmd: 'node cli/bin/pasteport.js',
        uninstallCmd: 'npm uninstall -g pasteport-zisphere',
    },
};

export default function CliDocsPage() {
    const [activeTab, setActiveTab] = useState<string>('menu');
    const [selectedPkg, setSelectedPkg] = useState<PkgType>('npm');

    const copyText = async (text: string, label = 'Command') => {
        await navigator.clipboard.writeText(text);
        showToast(`${label} copied to clipboard`);
    };

    const currentTab = CLI_TABS.find((t) => t.id === activeTab) || CLI_TABS[0];
    const currentPkg = PKG_CONFIGS[selectedPkg];

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Navbar />

            <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12">
                <div className="mx-auto max-w-5xl space-y-12">
                    {/* Hero */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-extrabold text-emerald-800 shadow-2xs">
                            ⚡ Zero-Dependency Developer CLI
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
                            Pasteport in Your Terminal
                        </h1>
                        <p className="mx-auto max-w-2xl text-sm font-medium text-slate-600 sm:text-base">
                            Pipe terminal logs, transfer files up to 600 MB, retrieve clips via 6-digit codes or web URLs, and automate cross-device sharing from bash, zsh, or CI/CD pipelines.
                        </p>

                        {/* Package Manager Selector Tabs */}
                        <div className="pt-2 flex flex-col items-center gap-3">
                            <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-2xs">
                                {(['npm', 'pnpm', 'bun', 'local'] as PkgType[]).map((pkg) => (
                                    <button
                                        key={pkg}
                                        onClick={() => setSelectedPkg(pkg)}
                                        className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                                            selectedPkg === pkg
                                                ? 'bg-slate-900 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        <span className="mr-1">{PKG_CONFIGS[pkg].icon}</span>
                                        {PKG_CONFIGS[pkg].name}
                                    </button>
                                ))}
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <button
                                    onClick={() => copyText(currentPkg.installCmd, `${currentPkg.name} install command`)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95"
                                >
                                    <span>{currentPkg.icon}</span>
                                    <span>{currentPkg.installCmd}</span>
                                </button>
                                <button
                                    onClick={() => copyText(currentPkg.execCmd, `${currentPkg.name} run command`)}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95"
                                >
                                    <span>⚡ Run: {currentPkg.execCmd}</span>
                                </button>
                            </div>

                            <div className="max-w-xl text-left rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-[11px] text-amber-900 leading-relaxed">
                                <span className="font-bold">💡 Note on NPM Registry & Local Usage:</span> If installing before public publication to <code className="font-mono bg-amber-100 px-1 rounded">registry.npmjs.org</code>, run <code className="font-mono bg-amber-100 px-1 font-bold rounded">npm install -g ./cli</code> (or <code className="font-mono bg-amber-100 px-1 rounded">npm link</code> inside the <code className="font-mono bg-amber-100 px-1 rounded">cli/</code> directory) to use the <code className="font-mono font-bold">pasteport</code> command immediately!
                            </div>
                        </div>
                    </div>

                    {/* Interactive CLI Workflow Simulator */}
                    <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-8 text-white shadow-xl space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-5">
                            <div>
                                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
                                    Interactive CLI Simulator
                                </span>
                                <h2 className="text-lg font-bold text-white sm:text-xl">
                                    {currentTab.title}
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">{currentTab.desc}</p>
                            </div>
                            <button
                                onClick={() => copyText(currentTab.command, 'Command')}
                                className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 active:scale-95 transition-all"
                            >
                                📋 Copy Command
                            </button>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex flex-wrap gap-2">
                            {CLI_TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`rounded-xl px-3 py-2 text-xs font-mono font-bold transition-all ${
                                        activeTab === tab.id
                                            ? 'bg-emerald-500 text-slate-950 shadow-xs'
                                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Terminal Screen Mockup */}
                        <div className="rounded-2xl border border-slate-800 bg-black/90 p-4 sm:p-5 font-mono text-xs text-slate-300 shadow-2xl space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 text-slate-500 text-[11px]">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
                                    <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
                                    <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
                                    <span className="ml-2 text-slate-400">bash — terminal session</span>
                                </div>
                                <span>Pasteport CLI v1.0.1</span>
                            </div>

                            <div className="text-emerald-400 font-bold select-all">
                                $ {currentTab.command}
                            </div>
                            <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto select-all">
                                {currentTab.terminalContent}
                            </pre>
                        </div>
                    </div>

                    {/* Standard Share vs Secret Share Storage Comparison */}
                    <div className="space-y-4">
                        <div className="text-center space-y-1">
                            <h2 className="text-2xl font-black text-slate-900">
                                📊 Storage Tiers: Standard vs Secret Share
                            </h2>
                            <p className="text-xs text-slate-500 sm:text-sm">
                                Choose the right share method directly from your terminal or the interactive menu.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {TIERS.map((tier) => (
                                <div
                                    key={tier.title}
                                    className={`rounded-3xl border p-6 shadow-xs space-y-3 ${tier.color}`}
                                >
                                    <h3 className="text-lg font-black">{tier.title}</h3>
                                    <ul className="space-y-2 text-xs">
                                        <li className="flex items-center justify-between border-b border-black/5 pb-1">
                                            <span className="font-bold">Maximum File Size:</span>
                                            <span className="font-mono font-extrabold text-sm">{tier.size}</span>
                                        </li>
                                        <li className="flex items-center justify-between border-b border-black/5 pb-1">
                                            <span className="font-bold">Authorization:</span>
                                            <span>{tier.auth}</span>
                                        </li>
                                        <li className="flex items-center justify-between border-b border-black/5 pb-1">
                                            <span className="font-bold">Storage Provider:</span>
                                            <span>{tier.dest}</span>
                                        </li>
                                        <li className="flex items-center justify-between border-b border-black/5 pb-1">
                                            <span className="font-bold">Retention Horizon:</span>
                                            <span>{tier.expiry}</span>
                                        </li>
                                        <li className="pt-2">
                                            <span className="font-bold text-[10px] uppercase tracking-wider block mb-1">
                                                CLI Syntax:
                                            </span>
                                            <code className="rounded-lg bg-white/80 px-2 py-1 font-mono text-xs font-bold block border border-black/5">
                                                {tier.cli}
                                            </code>
                                        </li>
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Install, NPX, Delete & Uninstall Grid */}
                    <div className="space-y-4">
                        <div className="text-center space-y-1">
                            <h2 className="text-2xl font-black text-slate-900">
                                ⚙️ CLI Commands & Package Management
                            </h2>
                            <p className="text-xs text-slate-500 sm:text-sm">
                                Install globally, run with NPX, purge clips with self-destruct, or uninstall.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {INSTALL_COMMANDS.map((item) => (
                                <div
                                    key={item.title}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                                        <button
                                            onClick={() => copyText(item.cmd, item.title)}
                                            className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500">{item.subtitle}</p>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-mono text-xs font-bold text-slate-800 select-all">
                                        $ {item.cmd}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Uninstallation Commands Grid */}
                    <div className="space-y-4">
                        <div className="text-center space-y-1">
                            <h2 className="text-2xl font-black text-slate-900">
                                🗑️ Uninstallation Commands (All Platforms)
                            </h2>
                            <p className="text-xs text-slate-500 sm:text-sm">
                                Clean, complete uninstallation commands for npm, pnpm, bun, python, winget, and Linux package managers.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {UNINSTALL_COMMANDS.map((item) => (
                                <div
                                    key={item.title}
                                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-bold text-slate-900">{item.title}</h3>
                                            <button
                                                onClick={() => copyText(item.cmd, item.title)}
                                                className="rounded-lg bg-slate-50 border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1">{item.desc}</p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 font-mono text-[11px] font-bold text-slate-800 select-all overflow-x-auto">
                                        $ {item.cmd}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Web Link Download Integration Walkthrough */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    🌐 Generate on Web → Download in Terminal
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    Create a share on any browser, then retrieve or download files directly from your terminal.
                                </p>
                            </div>
                            <Link
                                href="/send"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 active:scale-95"
                            >
                                Open Web Sender →
                            </Link>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3 text-xs">
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs">
                                    1
                                </span>
                                <h3 className="font-bold text-slate-900">Create Clip on Web</h3>
                                <p className="text-slate-500">
                                    Drop files or paste text on <Link href="/send" className="text-blue-600 underline">pasteport.zain-imran.com/send</Link>. Receive your 6-digit code or direct URL.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs">
                                    2
                                </span>
                                <h3 className="font-bold text-slate-900">Copy Share Code or URL</h3>
                                <p className="text-slate-500">
                                    Copy either the clean 6-digit code (e.g. <code className="font-bold text-slate-700">482193</code>) or the full link (<code className="font-bold text-slate-700">https://pasteport.zain-imran.com/view/482193</code>).
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs">
                                    3
                                </span>
                                <h3 className="font-bold text-slate-900">Download in Terminal</h3>
                                <p className="text-slate-500">
                                    Run <code className="font-mono text-blue-600 font-bold">pasteport get &lt;code-or-url&gt; -o ./file</code>. The CLI auto-extracts the code, validates PIN, and streams the download!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
