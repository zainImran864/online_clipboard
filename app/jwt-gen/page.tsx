'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { showToast } from '@/lib/appEvents';
import { computeHmac, stringToBase64Url, bufferToBase64Url } from '@/lib/cryptoHelpers';

export default function JwtGeneratorPage() {
    const router = useRouter();

    // Header State
    const [algorithm, setAlgorithm] = useState<'HS256' | 'HS384' | 'HS512'>('HS256');

    // Payload State
    const [sub, setSub] = useState<string>('user_9842');
    const [name, setName] = useState<string>('Alex Mercer');
    const [role, setRole] = useState<string>('admin');
    const [expOffsetSec, setExpOffsetSec] = useState<number>(3600); // 1 hour default
    const [customJson, setCustomJson] = useState<string>('{\n  "tenantId": "org_pasteport_2026"\n}');

    // Secret Key
    const [secret, setSecret] = useState<string>('super-secret-key-change-in-production-12345');

    // Generated Token & Parts
    const [headerB64, setHeaderB64] = useState<string>('');
    const [payloadB64, setPayloadB64] = useState<string>('');
    const [signatureB64, setSignatureB64] = useState<string>('');
    const [fullToken, setFullToken] = useState<string>('');

    const generateRandomSecret = () => {
        const bytes = new Uint8Array(32);
        crypto.getRandomValues(bytes);
        const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
        setSecret(hex);
        showToast('Generated 256-bit random secret');
    };

    useEffect(() => {
        let isMounted = true;

        const runSigning = async () => {
            try {
                const nowSec = Math.floor(Date.now() / 1000);
                const expSec = nowSec + expOffsetSec;

                const headerObj = {
                    alg: algorithm,
                    typ: 'JWT',
                };

                let extraClaims = {};
                try {
                    if (customJson.trim()) {
                        extraClaims = JSON.parse(customJson);
                    }
                } catch {
                    // ignore syntax error in custom JSON temporarily
                }

                const payloadObj = {
                    sub,
                    name,
                    role,
                    iat: nowSec,
                    exp: expSec,
                    ...extraClaims,
                };

                const hB64 = stringToBase64Url(JSON.stringify(headerObj));
                const pB64 = stringToBase64Url(JSON.stringify(payloadObj));
                const message = `${hB64}.${pB64}`;

                let hashAlg: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256';
                if (algorithm === 'HS384') hashAlg = 'SHA-384';
                if (algorithm === 'HS512') hashAlg = 'SHA-512';

                const sigBuf = await computeHmac(hashAlg, secret, message);
                const sB64 = bufferToBase64Url(sigBuf);

                if (isMounted) {
                    setHeaderB64(hB64);
                    setPayloadB64(pB64);
                    setSignatureB64(sB64);
                    setFullToken(`${message}.${sB64}`);
                }
            } catch {
                if (isMounted) {
                    setFullToken('');
                }
            }
        };

        void runSigning();

        return () => {
            isMounted = false;
        };
    }, [algorithm, sub, name, role, expOffsetSec, customJson, secret]);

    const copyToken = async () => {
        if (!fullToken) return;
        await navigator.clipboard.writeText(fullToken);
        showToast('JWT copied to clipboard');
    };

    const shareViaPasteport = () => {
        if (!fullToken) return;
        const text = `JWT Token:\n${fullToken}\n\nHeader: ${algorithm}\nSubject: ${sub}\nExpires in: ${expOffsetSec} seconds`;
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pasteport_prefill_text', text);
            router.push('/send');
        }
    };

    const testInDebugger = () => {
        if (!fullToken) return;
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pasteport_prefill_jwt', fullToken);
            router.push('/jwt');
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
                                🔐 Web Crypto Auth Engine
                            </div>
                            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                                JWT Generator & HMAC Signer
                            </h1>
                            <p className="text-xs text-slate-500 sm:text-sm">
                                Construct, customize claims, and sign HMAC JWT tokens with Web Crypto in browser memory.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={testInDebugger}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95"
                            >
                                🔍 Inspect in Debugger
                            </button>
                            <button
                                onClick={copyToken}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 shadow-xs hover:bg-blue-100 active:scale-95"
                            >
                                📋 Copy JWT
                            </button>
                            <button
                                onClick={shareViaPasteport}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95"
                            >
                                🚀 Share via Pasteport
                            </button>
                        </div>
                    </div>

                    {/* Output Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Generated Signed JWT
                            </span>
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                Signed with {algorithm}
                            </span>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs font-bold leading-relaxed break-all select-all">
                            <span className="text-rose-600">{headerB64}</span>
                            <span className="text-slate-400">.</span>
                            <span className="text-purple-600">{payloadB64}</span>
                            <span className="text-slate-400">.</span>
                            <span className="text-cyan-600">{signatureB64}</span>
                        </div>

                        <div className="flex items-center gap-4 text-[11px] font-bold">
                            <span className="flex items-center gap-1 text-rose-600">
                                <span className="h-2 w-2 rounded-full bg-rose-500" /> Header
                            </span>
                            <span className="flex items-center gap-1 text-purple-600">
                                <span className="h-2 w-2 rounded-full bg-purple-500" /> Payload
                            </span>
                            <span className="flex items-center gap-1 text-cyan-600">
                                <span className="h-2 w-2 rounded-full bg-cyan-500" /> Signature
                            </span>
                        </div>
                    </div>

                    {/* Claims Configuration */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Header & Secret */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                                Algorithm & Secret Key
                            </h2>

                            <div>
                                <label className="text-xs font-semibold text-slate-600">Signing Algorithm</label>
                                <div className="mt-1.5 flex rounded-xl border border-slate-200 p-1 bg-slate-50">
                                    {(['HS256', 'HS384', 'HS512'] as const).map((alg) => (
                                        <button
                                            key={alg}
                                            onClick={() => setAlgorithm(alg)}
                                            className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                                                algorithm === alg
                                                    ? 'bg-white text-blue-700 shadow-xs'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            {alg}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-slate-600">HMAC Secret Key</label>
                                    <button
                                        onClick={generateRandomSecret}
                                        className="text-[11px] font-bold text-blue-600 hover:underline"
                                    >
                                        🎲 Random Secret
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={secret}
                                    onChange={(e) => setSecret(e.target.value)}
                                    placeholder="Enter HMAC secret key..."
                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-xs text-slate-900 focus:bg-white focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-600">Expiration Lifetime</label>
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {[
                                        { label: '15 Min', sec: 900 },
                                        { label: '1 Hour', sec: 3600 },
                                        { label: '24 Hours', sec: 86400 },
                                        { label: '7 Days', sec: 604800 },
                                        { label: '30 Days', sec: 2592000 },
                                    ].map((opt) => (
                                        <button
                                            key={opt.label}
                                            onClick={() => setExpOffsetSec(opt.sec)}
                                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                                                expOffsetSec === opt.sec
                                                    ? 'bg-blue-600 text-white'
                                                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Payload Claims */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                                Payload Claims
                            </h2>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600">Subject (sub)</label>
                                    <input
                                        type="text"
                                        value={sub}
                                        onChange={(e) => setSub(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs focus:bg-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600">Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs focus:bg-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600">Role</label>
                                    <input
                                        type="text"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs focus:bg-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-600">Additional JSON Claims</label>
                                <textarea
                                    value={customJson}
                                    onChange={(e) => setCustomJson(e.target.value)}
                                    placeholder='{ "custom": "value" }'
                                    rows={4}
                                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs focus:bg-white focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
