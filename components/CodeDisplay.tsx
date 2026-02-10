'use client';

import React, { useState } from 'react';

interface CodeDisplayProps {
    code: string;
    shareUrl: string;
}

export default function CodeDisplay({ code, shareUrl }: CodeDisplayProps) {
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    const copyToClipboard = async (text: string, type: 'code' | 'link') => {
        try {
            await navigator.clipboard.writeText(text);
            if (type === 'code') {
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
            } else {
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
            }
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="w-full space-y-4 rounded-2xl bg-blue-100 p-6 shadow-lg">
            <div className="flex items-center gap-2 text-green-700">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                <h3 className="text-lg font-semibold">Share Code Generated!</h3>
            </div>

            {/* Numeric Code */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">6-Digit Code</label>
                <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-lg bg-white p-4 font-mono text-3xl font-bold tracking-widest text-gray-800 shadow-sm">
                        {code}
                    </div>
                    <button
                        onClick={() => copyToClipboard(code, 'code')}
                        className="rounded-lg bg-blue-500 p-4 text-white transition-all hover:bg-blue-600 active:scale-95"
                        title="Copy code"
                    >
                        {copiedCode ? (
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        ) : (
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Shareable Link */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Shareable Link</label>
                <div className="flex items-center gap-2">
                    <div className="flex-1 overflow-hidden rounded-lg bg-white p-3 shadow-sm">
                        <p className="truncate text-sm text-blue-600">{shareUrl}</p>
                    </div>
                    <button
                        onClick={() => copyToClipboard(shareUrl, 'link')}
                        className="rounded-lg bg-purple-500 p-3 text-white transition-all hover:bg-purple-600 active:scale-95"
                        title="Copy link"
                    >
                        {copiedLink ? (
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        ) : (
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            <p className="text-sm text-gray-600">
                💡 Share the code or link with anyone. They can access your content for 24 hours.
            </p>
        </div>
    );
}
