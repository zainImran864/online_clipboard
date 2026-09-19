'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { showToast } from '@/lib/appEvents';

// Color helper conversions
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    let clean = hex.replace('#', '').trim();
    if (clean.length === 3) {
        clean = clean.split('').map((c) => c + c).join('');
    }
    if (clean.length !== 6) return null;
    const num = parseInt(clean, 16);
    if (isNaN(num)) return null;
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
    };
}

function rgbToHex(r: number, g: number, b: number): string {
    const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
    return (
        '#' +
        [clamp(r), clamp(g), clamp(b)]
            .map((x) => x.toString(16).padStart(2, '0'))
            .join('')
    );
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100),
    };
}

function getLuminance(r: number, g: number, b: number): number {
    const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(lum1: number, lum2: number): number {
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
}

export default function ColorConverterPage() {
    const router = useRouter();
    const [hex, setHex] = useState<string>('#2563EB');

    const rgb = useMemo(() => hexToRgb(hex), [hex]);
    const hsl = useMemo(() => (rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null), [rgb]);

    // Contrast calculations
    const contrastInfo = useMemo(() => {
        if (!rgb) return null;
        const colorLum = getLuminance(rgb.r, rgb.g, rgb.b);
        const whiteLum = 1.0;
        const blackLum = 0.0;

        const againstWhite = getContrastRatio(colorLum, whiteLum);
        const againstBlack = getContrastRatio(colorLum, blackLum);

        return {
            whiteRatio: Math.round(againstWhite * 100) / 100,
            blackRatio: Math.round(againstBlack * 100) / 100,
            aaWhite: againstWhite >= 4.5,
            aaaWhite: againstWhite >= 7.0,
            aaBlack: againstBlack >= 4.5,
            aaaBlack: againstBlack >= 7.0,
        };
    }, [rgb]);

    // Tints and Shades
    const tintsAndShades = useMemo(() => {
        if (!rgb) return { tints: [], shades: [] };
        const tints: string[] = [];
        const shades: string[] = [];

        for (let i = 1; i <= 5; i++) {
            const factor = i * 0.15;
            // Tint: blend toward white
            const tr = rgb.r + (255 - rgb.r) * factor;
            const tg = rgb.g + (255 - rgb.g) * factor;
            const tb = rgb.b + (255 - rgb.b) * factor;
            tints.push(rgbToHex(tr, tg, tb));

            // Shade: blend toward black
            const sr = rgb.r * (1 - factor);
            const sg = rgb.g * (1 - factor);
            const sb = rgb.b * (1 - factor);
            shades.push(rgbToHex(sr, sg, sb));
        }

        return { tints, shades };
    }, [rgb]);

    const copyText = async (text: string, label = 'Copied') => {
        await navigator.clipboard.writeText(text);
        showToast(`${label} copied to clipboard`);
    };

    const shareViaPasteport = () => {
        if (!rgb || !hsl) return;
        const summary = `Color Spec:\nHEX: ${hex}\nRGB: rgb(${rgb.r}, ${rgb.g}, ${rgb.b})\nHSL: hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)\nCSS: --color-primary: ${hex};\n\nWCAG Contrast:\nAgainst White: ${contrastInfo?.whiteRatio}:1\nAgainst Black: ${contrastInfo?.blackRatio}:1`;
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pasteport_prefill_text', summary);
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
                                🎨 Color Space Engine
                            </div>
                            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                                Color Converter & Contrast Checker
                            </h1>
                            <p className="text-xs text-slate-500 sm:text-sm">
                                Convert HEX, RGB, HSL color codes, analyze WCAG 2.1 accessibility contrast, and generate tints & shades.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={shareViaPasteport}
                                disabled={!rgb}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
                            >
                                🚀 Share via Pasteport
                            </button>
                        </div>
                    </div>

                    {/* Main Interactive Swatch Card */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Swatch & Picker */}
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                            <div
                                className="h-44 w-full rounded-2xl shadow-inner transition-colors flex items-center justify-center relative overflow-hidden"
                                style={{ backgroundColor: hex }}
                            >
                                <span
                                    className="font-mono text-xl font-black uppercase tracking-wider"
                                    style={{ color: contrastInfo && contrastInfo.whiteRatio > contrastInfo.blackRatio ? '#ffffff' : '#000000' }}
                                >
                                    {hex}
                                </span>
                            </div>

                            <div className="flex w-full items-center gap-3">
                                <input
                                    type="color"
                                    value={rgb ? hex : '#000000'}
                                    onChange={(e) => setHex(e.target.value.toUpperCase())}
                                    className="h-10 w-12 cursor-pointer rounded-xl border border-slate-200 p-1 bg-white"
                                />
                                <input
                                    type="text"
                                    value={hex}
                                    onChange={(e) => setHex(e.target.value.toUpperCase())}
                                    placeholder="#2563EB"
                                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-sm font-bold text-slate-900 focus:bg-white focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Conversions Table */}
                        <div className="lg:col-span-2 flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                                Color Code Formats
                            </h2>

                            {rgb && hsl ? (
                                <div className="space-y-3">
                                    {[
                                        { label: 'HEX', val: hex },
                                        { label: 'RGB', val: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
                                        { label: 'RGBA (100%)', val: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)` },
                                        { label: 'HSL', val: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
                                        { label: 'CSS Variable', val: `--color-primary: ${hex};` },
                                    ].map((fmt) => (
                                        <div
                                            key={fmt.label}
                                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 hover:bg-slate-100 transition-colors"
                                        >
                                            <span className="w-28 text-xs font-bold text-slate-500">{fmt.label}</span>
                                            <span className="flex-1 font-mono text-xs font-bold text-slate-900 break-all select-all">
                                                {fmt.val}
                                            </span>
                                            <button
                                                onClick={() => copyText(fmt.val, fmt.label)}
                                                className="ml-2 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
                                    ⚠️ Invalid HEX format. Expected #RRGGBB or #RGB.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* WCAG Accessibility Contrast & Tints */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Contrast Checker */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                                WCAG 2.1 Accessibility Contrast
                            </h2>

                            {contrastInfo && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {/* Against White */}
                                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-600">On White (#FFF)</span>
                                            <span className="font-mono text-sm font-black text-slate-900">
                                                {contrastInfo.whiteRatio}:1
                                            </span>
                                        </div>
                                        <div className="flex gap-2 text-[10px] font-bold">
                                            <span className={`px-2 py-0.5 rounded ${contrastInfo.aaWhite ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                AA {contrastInfo.aaWhite ? 'Pass' : 'Fail'}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded ${contrastInfo.aaaWhite ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                AAA {contrastInfo.aaaWhite ? 'Pass' : 'Fail'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Against Black */}
                                    <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 shadow-2xs space-y-2 text-white">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-300">On Black (#000)</span>
                                            <span className="font-mono text-sm font-black text-white">
                                                {contrastInfo.blackRatio}:1
                                            </span>
                                        </div>
                                        <div className="flex gap-2 text-[10px] font-bold">
                                            <span className={`px-2 py-0.5 rounded ${contrastInfo.aaBlack ? 'bg-emerald-900/60 text-emerald-300' : 'bg-rose-900/60 text-rose-300'}`}>
                                                AA {contrastInfo.aaBlack ? 'Pass' : 'Fail'}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded ${contrastInfo.aaaBlack ? 'bg-emerald-900/60 text-emerald-300' : 'bg-rose-900/60 text-rose-300'}`}>
                                                AAA {contrastInfo.aaaBlack ? 'Pass' : 'Fail'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tints & Shades */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                                Tints (Lighter) & Shades (Darker)
                            </h2>

                            <div className="space-y-3">
                                <div>
                                    <span className="text-[11px] font-bold text-slate-500">Tints:</span>
                                    <div className="mt-1 flex gap-1.5 overflow-x-auto pb-1">
                                        {tintsAndShades.tints.map((c) => (
                                            <button
                                                key={c}
                                                onClick={() => { setHex(c); showToast(`Selected tint ${c}`); }}
                                                className="h-10 flex-1 min-w-[36px] rounded-lg border border-slate-200 transition-transform hover:scale-105"
                                                style={{ backgroundColor: c }}
                                                title={c}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <span className="text-[11px] font-bold text-slate-500">Shades:</span>
                                    <div className="mt-1 flex gap-1.5 overflow-x-auto pb-1">
                                        {tintsAndShades.shades.map((c) => (
                                            <button
                                                key={c}
                                                onClick={() => { setHex(c); showToast(`Selected shade ${c}`); }}
                                                className="h-10 flex-1 min-w-[36px] rounded-lg border border-slate-200 transition-transform hover:scale-105"
                                                style={{ backgroundColor: c }}
                                                title={c}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
