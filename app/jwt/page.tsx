'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { showToast } from '@/lib/appEvents';

function base64UrlDecode(str: string): string {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    switch (output.length % 4) {
        case 0:
            break;
        case 2:
            output += '==';
            break;
        case 3:
            output += '=';
            break;
        default:
            throw new Error('Illegal base64url string!');
    }
    return decodeURIComponent(
        atob(output)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
    );
}

const SAMPLE_JWT = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsZXggSm9yZGFuIiwiZW1haWwiOiJhbGV4QHByb3Rvbi5tZSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3Mzk0NDIwMCwiZXhwIjoxNzc0NTQ4ODAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;

export default function JwtDebuggerPage() {
    const router = useRouter();
    const [token, setToken] = useState(SAMPLE_JWT);
    const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
        return () => clearInterval(timer);
    }, []);

    const decoded = useMemo(() => {
        if (!token.trim()) return null;

        const parts = token.trim().split('.');
        if (parts.length !== 3) {
            return { error: 'Invalid JWT format: A valid token must have exactly 3 parts separated by dots (header.payload.signature).' };
        }

        try {
            const headerStr = base64UrlDecode(parts[0]);
            const payloadStr = base64UrlDecode(parts[1]);

            const header = JSON.parse(headerStr);
            const payload = JSON.parse(payloadStr);

            let expiryStatus = 'No expiration claim (exp)';
            let isExpired = false;

            if (typeof payload.exp === 'number' && currentTime > 0) {
                const expDate = new Date(payload.exp * 1000);
                isExpired = expDate.getTime() <= currentTime;

                const diffSeconds = Math.round((expDate.getTime() - currentTime) / 1000);
                if (isExpired) {
                    const agoHours = Math.round(Math.abs(diffSeconds) / 3600);
                    expiryStatus = `Expired on ${expDate.toLocaleString()} (~${agoHours}h ago)`;
                } else {
                    const inHours = (diffSeconds / 3600).toFixed(1);
                    expiryStatus = `Valid until ${expDate.toLocaleString()} (in ~${inHours} hours)`;
                }
            } else if (typeof payload.exp === 'number') {
                const expDate = new Date(payload.exp * 1000);
                expiryStatus = `Expires on ${expDate.toLocaleString()}`;
            }

            return {
                header,
                payload,
                signature: parts[2],
                rawHeader: parts[0],
                rawPayload: parts[1],
                isExpired,
                expiryStatus,
                error: null,
            };
        } catch (err) {
            return {
                error: err instanceof Error ? err.message : 'Failed to decode token segments.',
            };
        }
    }, [token, currentTime]);

    const copyDecodedPayload = async () => {
        if (!decoded || decoded.error) return;
        const text = JSON.stringify(decoded.payload, null, 2);
        await navigator.clipboard.writeText(text);
        showToast('Decoded payload copied to clipboard');
    };

    const shareDecodedViaPasteport = () => {
        if (!decoded || decoded.error) return;
        const payloadText = JSON.stringify({
            header: decoded.header,
            payload: decoded.payload,
            signature: decoded.signature,
        }, null, 2);

        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pasteport_prefill_text', payloadText);
            router.push('/send');
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Navbar />

            <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
                <div className="mx-auto max-w-6xl space-y-6">
                    {/* Title */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-800">
                                🔐 Zero-Knowledge Client Utility
                            </div>
                            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                                JWT Debugger & Claims Inspector
                            </h1>
                            <p className="text-xs text-slate-500 sm:text-sm">
                                Decode, inspect, and verify JSON Web Tokens entirely in your browser without transmitting sensitive tokens to any server.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={shareDecodedViaPasteport}
                                disabled={!decoded || Boolean(decoded.error)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
                            >
                                🚀 Share Payload via Pasteport
                            </button>
                        </div>
                    </div>

                    {/* Expiration Banner */}
                    {decoded && !decoded.error && (
                        <div
                            className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 shadow-xs ${
                                decoded.isExpired
                                    ? 'border-red-200 bg-red-50 text-red-900'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                            }`}
                        >
                            <div className="flex items-center gap-2 text-xs font-bold sm:text-sm">
                                <span>{decoded.isExpired ? '⚠️ Token Expired:' : '✓ Token Active:'}</span>
                                <span className="font-normal">{decoded.expiryStatus}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono">
                                <span className="rounded-md bg-white/80 px-2 py-0.5 shadow-2xs">
                                    Alg: <b>{decoded.header?.alg || 'Unknown'}</b>
                                </span>
                                <span className="rounded-md bg-white/80 px-2 py-0.5 shadow-2xs">
                                    Type: <b>{decoded.header?.typ || 'JWT'}</b>
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Editor & Output Grid */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Token Input */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                <span>Encoded Token</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setToken(SAMPLE_JWT)}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Load Sample
                                    </button>
                                    <button
                                        onClick={() => setToken('')}
                                        className="text-red-600 hover:underline"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                            <textarea
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="Paste your JWT (eyJhbGciOi...)"
                                spellCheck={false}
                                className="h-[460px] w-full rounded-2xl border-2 border-slate-200 bg-white p-4 font-mono text-xs leading-relaxed text-slate-800 focus:border-blue-500 focus:outline-none"
                            />
                            <p className="text-[11px] text-slate-400">
                                🔒 Token is parsed directly in your client memory using JavaScript — never sent across the network.
                            </p>
                        </div>

                        {/* Decoded Sections */}
                        <div className="space-y-4">
                            {decoded?.error ? (
                                <div className="flex h-[460px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-red-200 bg-red-50/50 p-6 text-center text-red-700">
                                    <span className="text-3xl">⚠️</span>
                                    <p className="mt-2 text-sm font-bold">Decoding Error</p>
                                    <p className="mt-1 text-xs text-red-600">{decoded.error}</p>
                                </div>
                            ) : decoded ? (
                                <div className="space-y-4">
                                    {/* Header */}
                                    <div className="rounded-2xl border border-rose-200 bg-white p-4 shadow-xs">
                                        <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                                            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-700">
                                                Header (Algorithm & Type)
                                            </span>
                                        </div>
                                        <pre className="mt-2 font-mono text-xs text-rose-900 overflow-auto">
                                            {JSON.stringify(decoded.header, null, 2)}
                                        </pre>
                                    </div>

                                    {/* Payload */}
                                    <div className="rounded-2xl border border-purple-200 bg-white p-4 shadow-xs">
                                        <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                                            <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700">
                                                Payload (Data Claims)
                                            </span>
                                            <button
                                                onClick={copyDecodedPayload}
                                                className="text-[11px] font-bold text-purple-700 hover:underline"
                                            >
                                                📋 Copy JSON
                                            </button>
                                        </div>
                                        <pre className="mt-2 font-mono text-xs text-purple-900 overflow-auto max-h-56">
                                            {JSON.stringify(decoded.payload, null, 2)}
                                        </pre>
                                    </div>

                                    {/* Signature */}
                                    <div className="rounded-2xl border border-cyan-200 bg-white p-4 shadow-xs">
                                        <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-700">
                                            Signature Verification Hash
                                        </span>
                                        <p className="mt-2 font-mono text-xs text-cyan-900 break-all bg-cyan-50/50 p-2 rounded-xl">
                                            {decoded.signature}
                                        </p>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
