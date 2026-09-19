'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { showToast } from '@/lib/appEvents';

const LOREM_WORDS = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
    'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
    'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation',
    'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo', 'consequat',
    'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate', 'velit', 'esse',
    'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat',
    'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt',
    'mollit', 'anim', 'id', 'est', 'laborum'
];

const FIRST_NAMES = ['Liam', 'Emma', 'Noah', 'Olivia', 'Ethan', 'Sophia', 'Lucas', 'Mia', 'Aiden', 'Ava', 'Zain', 'Maya'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor'];
const CITIES = ['San Francisco', 'New York', 'London', 'Berlin', 'Tokyo', 'Toronto', 'Sydney', 'Paris', 'Amsterdam'];
const CATEGORIES = ['Electronics', 'Home & Kitchen', 'Books', 'Fitness', 'Software', 'Clothing'];
const PRODUCT_NAMES = ['Wireless Noise-Cancelling Headphones', 'Ergonomic Mechanical Keyboard', 'Ultra-Wide 4K Monitor', 'Smart Home Security Hub', 'USB-C Multiport Docking Station', 'Portable Power Bank 20000mAh'];

function createRng(seed: number) {
    let s = (seed % 2147483647);
    if (s <= 0) s += 2147483646;
    return function() {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function generateSentence(rng: () => number, minWords = 8, maxWords = 15): string {
    const len = Math.floor(rng() * (maxWords - minWords + 1)) + minWords;
    const words: string[] = [];
    for (let i = 0; i < len; i++) {
        const w = LOREM_WORDS[Math.floor(rng() * LOREM_WORDS.length)];
        words.push(i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w);
    }
    return words.join(' ') + '.';
}

function generateParagraph(rng: () => number, sentenceCount = 5): string {
    const sentences: string[] = [];
    for (let i = 0; i < sentenceCount; i++) {
        sentences.push(generateSentence(rng));
    }
    return sentences.join(' ');
}

export default function LoremDummyPage() {
    const router = useRouter();
    const [seed, setSeed] = useState<number>(42);
    const [tab, setTab] = useState<'lorem' | 'json'>('lorem');

    // Lorem State
    const [loremType, setLoremType] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
    const [loremCount, setLoremCount] = useState<number>(3);
    const [startWithLorem, setStartWithLorem] = useState<boolean>(true);
    const [wrapHtml, setWrapHtml] = useState<boolean>(false);

    // Dummy JSON State
    const [schemaType, setSchemaType] = useState<'users' | 'products' | 'posts' | 'orders'>('users');
    const [jsonCount, setJsonCount] = useState<number>(5);
    const [minifyJson, setMinifyJson] = useState<boolean>(false);

    // Generate Lorem
    const generatedLorem = useMemo(() => {
        const rng = createRng(seed);
        let text = '';
        if (loremType === 'paragraphs') {
            const paras: string[] = [];
            for (let i = 0; i < loremCount; i++) {
                let p = generateParagraph(rng);
                if (i === 0 && startWithLorem) {
                    p = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ' + p;
                }
                paras.push(wrapHtml ? `<p>${p}</p>` : p);
            }
            text = paras.join('\n\n');
        } else if (loremType === 'sentences') {
            const sents: string[] = [];
            for (let i = 0; i < loremCount; i++) {
                sents.push(generateSentence(rng));
            }
            text = sents.join(' ');
        } else {
            const words: string[] = [];
            for (let i = 0; i < loremCount; i++) {
                words.push(LOREM_WORDS[Math.floor(rng() * LOREM_WORDS.length)]);
            }
            if (startWithLorem && words.length >= 2) {
                words[0] = 'lorem';
                words[1] = 'ipsum';
            }
            text = words.join(' ');
        }
        return text;
    }, [loremType, loremCount, startWithLorem, wrapHtml, seed]);

    // Generate Dummy JSON
    const generatedJson = useMemo(() => {
        const rng = createRng(seed + 1000);
        const baseDate = 1774000000000;
        const items: unknown[] = [];
        for (let i = 1; i <= jsonCount; i++) {
            if (schemaType === 'users') {
                const fname = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
                const lname = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
                items.push({
                    id: i,
                    name: `${fname} ${lname}`,
                    email: `${fname.toLowerCase()}.${lname.toLowerCase()}@example.com`,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fname}`,
                    role: i === 1 ? 'admin' : 'member',
                    city: CITIES[Math.floor(rng() * CITIES.length)],
                    createdAt: new Date(baseDate - i * 86400000).toISOString(),
                });
            } else if (schemaType === 'products') {
                const title = PRODUCT_NAMES[(i - 1) % PRODUCT_NAMES.length];
                items.push({
                    id: i,
                    title,
                    price: Math.floor(rng() * 250) + 19.99,
                    category: CATEGORIES[Math.floor(rng() * CATEGORIES.length)],
                    rating: Math.round((3.5 + rng() * 1.5) * 10) / 10,
                    inStock: rng() > 0.15,
                    sku: `SKU-${1000 + i}`,
                });
            } else if (schemaType === 'posts') {
                items.push({
                    id: i,
                    title: `Mastering ${CATEGORIES[i % CATEGORIES.length]}: A Comprehensive Guide`,
                    slug: `mastering-topic-${i}`,
                    excerpt: generateSentence(rng, 10, 18),
                    author: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`,
                    likes: Math.floor(rng() * 500) + 10,
                    publishedAt: new Date(baseDate - i * 3600000 * 12).toISOString(),
                });
            } else if (schemaType === 'orders') {
                items.push({
                    orderId: `ORD-${9000 + i}`,
                    customer: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`,
                    totalAmount: Math.floor(rng() * 400) + 25,
                    currency: 'USD',
                    status: ['delivered', 'processing', 'shipped'][i % 3],
                    createdAt: new Date(baseDate - i * 1800000).toISOString(),
                });
            }
        }
        return minifyJson ? JSON.stringify(items) : JSON.stringify(items, null, 2);
    }, [schemaType, jsonCount, minifyJson, seed]);

    const activeContent = tab === 'lorem' ? generatedLorem : generatedJson;

    const copyContent = async () => {
        await navigator.clipboard.writeText(activeContent);
        showToast(`Copied ${tab === 'lorem' ? 'Lorem text' : 'Dummy JSON'} to clipboard`);
    };

    const downloadFile = () => {
        const ext = tab === 'lorem' ? 'txt' : 'json';
        const type = tab === 'lorem' ? 'text/plain' : 'application/json';
        const blob = new Blob([activeContent], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mock-data.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Downloaded mock-data.${ext}`);
    };

    const shareViaPasteport = () => {
        if (!activeContent.trim()) return;
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pasteport_prefill_text', activeContent);
            router.push('/send');
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Navbar />

            <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
                <div className="mx-auto max-w-5xl space-y-6">
                    {/* Header */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                                📝 Mock Data Engine
                            </div>
                            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                                Lorem Ipsum & Dummy JSON Generator
                            </h1>
                            <p className="text-xs text-slate-500 sm:text-sm">
                                Generate placeholder placeholder text, sentences, paragraphs, or structured mock JSON datasets for frontend development.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => {
                                    setSeed((s) => s + 1);
                                    showToast('Regenerated mock data');
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95"
                            >
                                🔄 Regenerate
                            </button>
                            <button
                                onClick={copyContent}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95"
                            >
                                📋 Copy
                            </button>
                            <button
                                onClick={downloadFile}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95"
                            >
                                💾 Download
                            </button>
                            <button
                                onClick={shareViaPasteport}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95"
                            >
                                🚀 Share via Pasteport
                            </button>
                        </div>
                    </div>

                    {/* Mode Selector Tab */}
                    <div className="flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs">
                        <button
                            onClick={() => setTab('lorem')}
                            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all sm:text-sm ${
                                tab === 'lorem'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            📄 Lorem Ipsum Text
                        </button>
                        <button
                            onClick={() => setTab('json')}
                            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all sm:text-sm ${
                                tab === 'json'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            📦 Dummy Mock JSON
                        </button>
                    </div>

                    {/* Config Panel */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                        {tab === 'lorem' ? (
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Units
                                    </label>
                                    <div className="mt-2 flex rounded-xl border border-slate-200 p-1 bg-slate-50">
                                        {(['paragraphs', 'sentences', 'words'] as const).map((unit) => (
                                            <button
                                                key={unit}
                                                onClick={() => setLoremType(unit)}
                                                className={`flex-1 rounded-lg py-1.5 text-xs font-bold capitalize transition-all ${
                                                    loremType === unit
                                                        ? 'bg-white text-blue-700 shadow-xs'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                            >
                                                {unit}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Quantity ({loremCount})
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="20"
                                        value={loremCount}
                                        onChange={(e) => setLoremCount(Number(e.target.value))}
                                        className="mt-3 w-full cursor-pointer accent-blue-600"
                                    />
                                </div>

                                <div className="flex flex-col justify-end gap-2">
                                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={startWithLorem}
                                            onChange={(e) => setStartWithLorem(e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        Start with &quot;Lorem ipsum...&quot;
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={wrapHtml}
                                            onChange={(e) => setWrapHtml(e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        Wrap in &lt;p&gt; tags
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Entity Schema
                                    </label>
                                    <select
                                        value={schemaType}
                                        onChange={(e) => setSchemaType(e.target.value as 'users' | 'products' | 'posts' | 'orders')}
                                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                                    >
                                        <option value="users">👤 Users (profiles, emails, roles)</option>
                                        <option value="products">🛍️ Products (titles, prices, SKUs)</option>
                                        <option value="posts">📰 Blog Posts (titles, slugs, authors)</option>
                                        <option value="orders">💳 Orders (customers, totals, statuses)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Item Count ({jsonCount})
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="25"
                                        value={jsonCount}
                                        onChange={(e) => setJsonCount(Number(e.target.value))}
                                        className="mt-3 w-full cursor-pointer accent-blue-600"
                                    />
                                </div>

                                <div className="flex flex-col justify-end">
                                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={minifyJson}
                                            onChange={(e) => setMinifyJson(e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        Minify Output (Single Line)
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Output Area */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="font-bold uppercase tracking-wider">Output Preview</span>
                            <span className="font-mono">{activeContent.length} characters</span>
                        </div>
                        <textarea
                            readOnly
                            value={activeContent}
                            rows={16}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-900 focus:outline-none sm:text-sm select-all"
                        />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
