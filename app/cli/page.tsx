'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { showToast } from '@/lib/appEvents';

const COMMANDS = [
    {
        name: 'pasteport send "text"',
        desc: 'Send a string snippet directly from your terminal and receive a 6-digit share code & URL.',
        example: 'pasteport send "hello world"',
        output: '✔ Clip Created Successfully!\nShare Code:  482193\nDirect Link: https://pasteport.zain-imran.com/view/482193\nExpires:     24 hours',
    },
    {
        name: 'cat file | pasteport send',
        desc: 'Pipe terminal outputs, logs, or command results directly into Pasteport without temporary files.',
        example: 'git diff | pasteport send --expiry 6',
        output: '✔ Clip Created Successfully!\nShare Code:  719302\nDirect Link: https://pasteport.zain-imran.com/view/719302\nExpires:     6 hours',
    },
    {
        name: 'pasteport send <file>',
        desc: 'Upload archives, binaries, or documents (up to 100 MB) with automatic Cloudflare R2 storage.',
        example: 'pasteport send ./build.zip --pin pass',
        output: '✔ Clip Created Successfully!\nShare Code:  934812\nDirect Link: https://pasteport.zain-imran.com/view/934812\nAccess PIN:  Locked with 4-char PIN',
    },
    {
        name: 'pasteport get <code>',
        desc: 'Retrieve clip text, display formatted output, or supply PIN if protected.',
        example: 'pasteport get 482193',
        output: '── Text Clip [Code: 482193] ───────────────────\nhello world\n──────────────────────────────────────────────',
    },
    {
        name: 'pasteport get <code> --raw',
        desc: 'Stream raw text directly to stdout for Unix piping into downstream scripts or compilers.',
        example: 'pasteport get 482193 --raw > config.json',
        output: '(Output redirected to config.json with exit code 0)',
    },
    {
        name: 'pasteport get <code> -o <path>',
        desc: 'Download shared zip files or binary attachments directly to your destination path.',
        example: 'pasteport get 934812 -o ./received.zip -p pass',
        output: 'Downloading build.zip to ./received.zip...\n✔ Download complete: ./received.zip',
    },
];

const FLAGS = [
    { flag: '-p, --pin <4-char>', desc: 'Lock clip behind a 4-character PIN (or supply PIN when getting).' },
    { flag: '-e, --expiry <hours>', desc: 'Set expiration horizon in hours (1-72 hours, default: 24).' },
    { flag: '-d, --self-destruct', desc: 'Configure self-destruct PIN so clip is purged upon retrieval.' },
    { flag: '-o, --output <path>', desc: 'Write retrieved text or downloaded binary file to destination path.' },
    { flag: '--raw', desc: 'Print raw content without headers/metadata (ideal for pipes).' },
    { flag: '--json', desc: 'Format all output strictly as machine-readable JSON for CI/CD scripting.' },
    { flag: '--server <url>', desc: 'Override default backend endpoint (supports local dev or self-hosted).' },
];

export default function CliDocsPage() {
    const [activeIdx, setActiveIdx] = useState<number>(0);

    const copyText = async (text: string, label = 'Command') => {
        await navigator.clipboard.writeText(text);
        showToast(`${label} copied to clipboard`);
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Navbar />

            <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12">
                <div className="mx-auto max-w-5xl space-y-10">
                    {/* Header */}
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700">
                            ⚡ Developer Command-Line Tool
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 sm:text-5xl">
                            Pasteport CLI
                        </h1>
                        <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
                            The cross-device clipboard in your terminal. Pipe terminal outputs, upload zip files,
                            beam code snippets across servers, and integrate Pasteport directly into your CI/CD workflows.
                        </p>
                    </div>

                    {/* Quick Install Banner */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 sm:p-6 text-white shadow-md space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                                    Instant Installation
                                </span>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Runs on Node.js 18+ on Windows, macOS, and Linux. Zero external dependencies.
                                </p>
                            </div>
                            <button
                                onClick={() => copyText('npm install -g pasteport-cli', 'Install command')}
                                className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500 active:scale-95"
                            >
                                Copy Install Command
                            </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 font-mono text-xs">
                            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1">
                                <span className="text-[10px] uppercase text-slate-500 font-sans font-bold">
                                    Global Installation:
                                </span>
                                <div className="text-emerald-400 font-bold select-all">
                                    $ npm install -g pasteport-cli
                                </div>
                            </div>
                            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1">
                                <span className="text-[10px] uppercase text-slate-500 font-sans font-bold">
                                    Run Instantly with NPX:
                                </span>
                                <div className="text-blue-300 font-bold select-all">
                                    $ npx pasteport send &quot;hello world&quot;
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Command Simulator */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Command Reference & Interactive Examples
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Click any command to view live syntax and simulated terminal output.
                                </p>
                            </div>
                            <button
                                onClick={() => copyText(COMMANDS[activeIdx].example, 'Example command')}
                                className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                            >
                                📋 Copy Active Example
                            </button>
                        </div>

                        {/* Command Pills */}
                        <div className="flex flex-wrap gap-2">
                            {COMMANDS.map((cmd, idx) => (
                                <button
                                    key={cmd.name}
                                    onClick={() => setActiveIdx(idx)}
                                    className={`rounded-xl px-3 py-2 font-mono text-xs font-bold transition-all ${
                                        activeIdx === idx
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    {cmd.name}
                                </button>
                            ))}
                        </div>

                        {/* Terminal Window Output */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5 font-mono text-xs text-slate-300 shadow-lg space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-slate-500 text-[11px]">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
                                    <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
                                    <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
                                    <span className="ml-2">bash — terminal</span>
                                </div>
                                <span>Pasteport CLI</span>
                            </div>

                            <div className="space-y-1">
                                <p className="text-slate-400 font-sans text-xs mb-2">
                                    💡 {COMMANDS[activeIdx].desc}
                                </p>
                                <div className="text-emerald-400 font-bold select-all">
                                    $ {COMMANDS[activeIdx].example}
                                </div>
                                <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed pt-2">
                                    {COMMANDS[activeIdx].output}
                                </pre>
                            </div>
                        </div>
                    </div>

                    {/* Flags & Options Table */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                        <h2 className="text-base font-bold text-slate-900">
                            Available CLI Flags & Modifiers
                        </h2>

                        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden text-xs">
                            {FLAGS.map((f) => (
                                <div key={f.flag} className="flex flex-col sm:flex-row sm:items-center p-3.5 bg-white hover:bg-slate-50 transition-colors gap-2">
                                    <span className="w-48 font-mono font-bold text-blue-600">{f.flag}</span>
                                    <span className="flex-1 text-slate-600">{f.desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CI/CD Integration Snippet */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-slate-900">
                                🤖 CI/CD Integration (GitHub Actions)
                            </h2>
                            <button
                                onClick={() =>
                                    copyText(
                                        `- name: Share Build Logs to Pasteport\n  run: |\n    cat build.log | npx pasteport send --expiry 12 --json > clip.json\n    echo "Logs available at: $(jq -r .url clip.json)"`,
                                        'CI snippet'
                                    )
                                }
                                className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                            >
                                Copy YAML
                            </button>
                        </div>
                        <p className="text-xs text-slate-500">
                            Upload test failures, build artifacts, or deployment manifests directly to Pasteport in your automated pipelines.
                        </p>

                        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 overflow-x-auto">
                            <pre className="text-blue-300">{`- name: Share Build Logs to Pasteport
  run: |
    cat build.log | npx pasteport send --expiry 12 --json > clip.json
    echo "Logs available at: $(jq -r .url clip.json)"`}</pre>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
