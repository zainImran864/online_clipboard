'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import yaml from 'js-yaml';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { showToast } from '@/lib/appEvents';

const SAMPLE_YAML = `version: "3.8"
services:
  web:
    image: node:20-alpine
    container_name: pasteport-app
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
    restart: always
    volumes:
      - ./data:/app/data
`;

const SAMPLE_JSON = `{
  "version": "3.8",
  "services": {
    "web": {
      "image": "node:20-alpine",
      "container_name": "pasteport-app",
      "ports": [
        "3000:3000"
      ],
      "environment": {
        "NODE_ENV": "production",
        "PORT": 3000
      },
      "restart": "always",
      "volumes": [
        "./data:/app/data"
      ]
    }
  }
}`;

export default function YamlJsonConverterPage() {
    const router = useRouter();
    const [yamlCode, setYamlCode] = useState<string>(SAMPLE_YAML);
    const [jsonCode, setJsonCode] = useState<string>(SAMPLE_JSON);
    const [error, setError] = useState<string | null>(null);
    const [indentSpaces, setIndentSpaces] = useState<number>(2);

    const convertYamlToJson = () => {
        try {
            const parsed = yaml.load(yamlCode);
            const jsonStr = JSON.stringify(parsed, null, indentSpaces);
            setJsonCode(jsonStr);
            setError(null);
            showToast('Converted YAML → JSON');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid YAML syntax');
        }
    };

    const convertJsonToYaml = () => {
        try {
            const parsed = JSON.parse(jsonCode);
            const yamlStr = yaml.dump(parsed, { indent: indentSpaces });
            setYamlCode(yamlStr);
            setError(null);
            showToast('Converted JSON → YAML');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid JSON syntax');
        }
    };

    const copyText = async (text: string, label: string) => {
        if (!text.trim()) return;
        await navigator.clipboard.writeText(text);
        showToast(`${label} copied to clipboard`);
    };

    const downloadFile = (content: string, filename: string, type: string) => {
        if (!content.trim()) return;
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Downloaded ${filename}`);
    };

    const shareViaPasteport = (content: string) => {
        if (!content.trim()) return;
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pasteport_prefill_text', content);
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
                                📑 Serialization Engine
                            </div>
                            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                                YAML ↔ JSON Converter
                            </h1>
                            <p className="text-xs text-slate-500 sm:text-sm">
                                Bi-directional conversion between YAML and JSON format with live syntax validation.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => shareViaPasteport(yamlCode)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95"
                            >
                                🚀 Share via Pasteport
                            </button>
                        </div>
                    </div>

                    {/* Central Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={convertYamlToJson}
                                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95"
                            >
                                YAML ➔ JSON
                            </button>
                            <button
                                onClick={convertJsonToYaml}
                                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-95"
                            >
                                JSON ➔ YAML
                            </button>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <span>Indent:</span>
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

                    {error && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Dual Panes */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* YAML Pane */}
                        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    YAML Input / Output
                                </span>
                                <div className="flex gap-1.5">
                                    <button
                                        onClick={() => copyText(yamlCode, 'YAML')}
                                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
                                    >
                                        Copy
                                    </button>
                                    <button
                                        onClick={() => downloadFile(yamlCode, 'config.yaml', 'text/yaml')}
                                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
                                    >
                                        Download
                                    </button>
                                </div>
                            </div>
                            <textarea
                                value={yamlCode}
                                onChange={(e) => setYamlCode(e.target.value)}
                                placeholder="Paste or type YAML here..."
                                rows={18}
                                className="flex-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none sm:text-sm"
                            />
                        </div>

                        {/* JSON Pane */}
                        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    JSON Input / Output
                                </span>
                                <div className="flex gap-1.5">
                                    <button
                                        onClick={() => copyText(jsonCode, 'JSON')}
                                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
                                    >
                                        Copy
                                    </button>
                                    <button
                                        onClick={() => downloadFile(jsonCode, 'config.json', 'application/json')}
                                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
                                    >
                                        Download
                                    </button>
                                </div>
                            </div>
                            <textarea
                                value={jsonCode}
                                onChange={(e) => setJsonCode(e.target.value)}
                                placeholder="Paste or type JSON here..."
                                rows={18}
                                className="flex-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none sm:text-sm"
                            />
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
