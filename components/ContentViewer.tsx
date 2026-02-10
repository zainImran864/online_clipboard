'use client';

import React, { useState } from 'react';
import { Clip } from '@/hooks/useClipboard';

interface ContentViewerProps {
    clip: Clip;
}

export default function ContentViewer({ clip }: ContentViewerProps) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(clip.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const downloadFile = () => {
        const link = document.createElement('a');
        link.href = clip.content;
        link.download = clip.fileName || 'download';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderContent = () => {
        if (clip.type === 'text') {
            return (
                <div className="rounded-lg bg-gray-50 p-6">
                    <pre className="whitespace-pre-wrap break-words font-sans text-gray-800">
                        {clip.content}
                    </pre>
                </div>
            );
        }

        // File type
        if (clip.fileType?.startsWith('image/')) {
            return (
                <div className="flex justify-center rounded-lg bg-gray-50 p-6">
                    <img
                        src={clip.content}
                        alt={clip.fileName || 'Shared image'}
                        className="max-h-96 rounded-lg shadow-md"
                    />
                </div>
            );
        }

        if (clip.fileType === 'application/pdf') {
            return (
                <div className="rounded-lg bg-gray-50 p-6">
                    <div className="flex items-center gap-3 text-gray-700">
                        <svg className="h-12 w-12 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                            <path d="M14 2v6h6" />
                        </svg>
                        <div>
                            <p className="font-semibold">{clip.fileName}</p>
                            <p className="text-sm text-gray-500">PDF Document</p>
                        </div>
                    </div>
                </div>
            );
        }

        // Text file
        return (
            <div className="rounded-lg bg-gray-50 p-6">
                <div className="flex items-center gap-3 text-gray-700">
                    <svg className="h-12 w-12 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                        <path d="M14 2v6h6M16 13H8m8 4H8m2-8H8" />
                    </svg>
                    <div>
                        <p className="font-semibold">{clip.fileName}</p>
                        <p className="text-sm text-gray-500">Text File</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full space-y-4">
            {/* Content Display */}
            <div className="rounded-2xl bg-white p-6 shadow-lg">{renderContent()}</div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                {clip.type === 'text' && (
                    <button
                        onClick={copyToClipboard}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-500 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-600 active:scale-95"
                    >
                        {copied ? (
                            <>
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                                Copied!
                            </>
                        ) : (
                            <>
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                </svg>
                                Copy Text
                            </>
                        )}
                    </button>
                )}
                {clip.type === 'file' && (
                    <button
                        onClick={downloadFile}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-500 px-6 py-3 font-semibold text-white transition-all hover:bg-purple-600 active:scale-95"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                        Download File
                    </button>
                )}
            </div>

            {/* Metadata */}
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                <p>
                    <span className="font-semibold">Created:</span>{' '}
                    {clip.createdAt.toLocaleString()}
                </p>
                {clip.expiresAt && (
                    <p>
                        <span className="font-semibold">Expires:</span>{' '}
                        {clip.expiresAt.toLocaleString()}
                    </p>
                )}
            </div>
        </div>
    );
}
