'use client';

import React from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import Footer from '@/components/Footer';
import ClipboardMiniGame from '@/components/ClipboardMiniGame';

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <header className="p-6">
                <Link href="/">
                    <Logo size={48} />
                </Link>
            </header>

            <main className="flex flex-1 items-center justify-center px-4 py-8">
                <div className="w-full max-w-lg space-y-6 text-center">
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
                        <span className="text-4xl font-extrabold text-blue-600 block">404</span>
                        <h1 className="mt-2 text-2xl font-bold text-slate-800">Page Not Found</h1>
                        <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                            The page or clip you are looking for doesn&apos;t exist or has reached its 24-hour expiration limit.
                        </p>
                        <div className="mt-5 flex justify-center gap-3">
                            <Link
                                href="/"
                                className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700"
                            >
                                Back to Home
                            </Link>
                            <Link
                                href="/send"
                                className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                            >
                                Create Share
                            </Link>
                        </div>
                    </div>

                    {/* Interactive mini-game */}
                    <div className="pt-2">
                        <ClipboardMiniGame />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
