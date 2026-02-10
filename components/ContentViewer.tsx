'use client';

import React, { useState, useEffect } from 'react';
import { Clip } from '@/hooks/useClipboard';

interface ContentViewerProps {
    clip: Clip;
}

// Helper component to display code files
function CodeFilePreview({ url, fileName, fileType }: { url: string; fileName: string; fileType: string }) {
    const [content, setContent] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch and decode base64 content
        const fetchContent = async () => {
            try {
                if (url.startsWith('data:')) {
                    // Extract base64 part
                    const base64Data = url.split(',')[1];
                    const decodedContent = atob(base64Data);
                    setContent(decodedContent);
                } else {
                    const response = await fetch(url);
                    const text = await response.text();
                    setContent(text);
                }
            } catch (error) {
                console.error('Failed to load file content:', error);
                setContent('// Failed to load file content');
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, [url]);

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const getLanguageLabel = () => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        const labels: Record<string, string> = {
            js: 'JavaScript',
            jsx: 'React JSX',
            ts: 'TypeScript',
            tsx: 'React TSX',
            py: 'Python',
            html: 'HTML',
            css: 'CSS',
            json: 'JSON',
            xml: 'XML',
            java: 'Java',
            c: 'C',
            cpp: 'C++',
            cs: 'C#',
            php: 'PHP',
            rb: 'Ruby',
            go: 'Go',
            rs: 'Rust',
            swift: 'Swift',
            kt: 'Kotlin',
            sql: 'SQL',
            sh: 'Shell',
            yml: 'YAML',
            yaml: 'YAML',
            md: 'Markdown',
        };
        return labels[ext || ''] || 'Code';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center rounded-lg bg-gray-100 p-8">
                <p className="text-gray-500">Loading file...</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* File Header */}
            <div className="flex items-center justify-between rounded-t-lg bg-gray-800 px-4 py-2">
                <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                        <path d="M14 2v6h6M16 13H8m8 4H8m2-8H8" />
                    </svg>
                    <span className="text-sm font-semibold text-white">{fileName}</span>
                    <span className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300">
                        {getLanguageLabel()}
                    </span>
                </div>
                <button
                    onClick={copyCode}
                    className="rounded bg-gray-700 px-3 py-1 text-xs text-white transition-colors hover:bg-gray-600"
                >
                    {copied ? '✓ Copied' : 'Copy'}
                </button>
            </div>

            {/* Code Content */}
            <div className="overflow-hidden rounded-b-lg bg-gray-900">
                <div className="max-h-96 overflow-auto">
                    <pre className="p-4 text-sm">
                        <code className="text-gray-100 font-mono">{content}</code>
                    </pre>
                </div>
            </div>

            {/* Line count info */}
            <p className="text-xs text-gray-500">
                {content.split('\n').length} lines • {Math.round(content.length / 1024)} KB
            </p>
        </div>
    );
}

export default function ContentViewer({ clip }: ContentViewerProps) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const downloadFile = (fileUrl?: string, fileName?: string) => {
        const link = document.createElement('a');
        link.href = fileUrl || clip.content;
        link.download = fileName || clip.fileName || 'download';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadAllFiles = () => {
        if (clip.files && clip.files.length > 1) {
            clip.files.forEach((file, index) => {
                setTimeout(() => {
                    downloadFile(file.url, file.fileName);
                }, index * 300); // Stagger downloads
            });
        } else {
            downloadFile();
        }
    };

    const downloadTextAsFile = () => {
        const textContent = clip.type === 'text' ? clip.content : clip.textContent;
        if (!textContent) {
            console.error('No text content to download');
            return;
        }
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent));
        element.setAttribute('download', clip.fileName || 'clipboard-content.txt');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const renderContent = () => {
        // Handle 'both' type - show both text and file
        if (clip.type === 'both') {
            return (
                <div className="space-y-4">
                    {/* Text Content */}
                    {clip.textContent && (
                        <div>
                            <h4 className="mb-2 text-sm font-semibold text-gray-700">📝 Text Content</h4>
                            <div className="rounded-lg bg-gray-50 p-6">
                                <pre className="whitespace-pre-wrap break-words font-sans text-gray-800">
                                    {clip.textContent}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* File Content */}
                    <div>
                        <h4 className="mb-2 text-sm font-semibold text-gray-700">📎 Attached File</h4>
                        {renderFilePreview()}
                    </div>
                </div>
            );
        }

        // Handle text-only type
        if (clip.type === 'text') {
            return (
                <div className="rounded-lg bg-gray-50 p-6">
                    <pre className="whitespace-pre-wrap break-words font-sans text-gray-800">
                        {clip.content}
                    </pre>
                </div>
            );
        }

        // Handle file-only type
        return renderFilePreview();
    };

    const renderFilePreview = () => {
        const files = clip.files || [];
        
        if (files.length === 0) return null;

        // Multiple files - show grid
        if (files.length > 1) {
            return (
                <div className="space-y-4">
                    <p className="text-sm font-semibold text-gray-700">
                        📎 {files.length} files attached
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {files.map((file, index) => (
                            <div
                                key={index}
                                className="group relative overflow-hidden rounded-lg bg-gray-50 p-4 transition-all hover:bg-gray-100 hover:shadow-md"
                            >
                                {renderSingleFile(file)}
                                {/* Hover Download Button */}
                                <button
                                    onClick={() => downloadFile(file.url, file.fileName)}
                                    className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity hover:bg-blue-700 group-hover:opacity-100"
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                        />
                                    </svg>
                                    Download
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // Single file - show large preview
        return renderSingleFile(files[0]);
    };

    const renderSingleFile = (file: { url: string; fileName: string; fileType: string }) => {
        const fileExt = file.fileName.split('.').pop()?.toLowerCase() || '';
        
        // Code file extensions
        const codeExtensions = ['html', 'htm', 'css', 'js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'py', 'java', 'c', 'cpp', 'h', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'sql', 'sh', 'bash', 'yml', 'yaml', 'md'];
        const isCodeFile = codeExtensions.includes(fileExt) || file.fileType?.startsWith('text/') || file.fileType?.includes('javascript') || file.fileType?.includes('json') || file.fileType?.includes('xml');

        // Image file
        if (file.fileType?.startsWith('image/')) {
            return (
                <div className="flex justify-center rounded-lg bg-gray-50 p-6">
                    <img
                        src={file.url}
                        alt={file.fileName || 'Shared image'}
                        className="max-h-96 rounded-lg shadow-md"
                    />
                </div>
            );
        }

        // Code files - display with syntax
        if (isCodeFile) {
            return (
                <CodeFilePreview url={file.url} fileName={file.fileName} fileType={file.fileType} />
            );
        }

        // PDF file
        if (file.fileType === 'application/pdf') {
            return (
                <div className="flex items-center gap-3 text-gray-700">
                    <svg className="h-12 w-12 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                        <path d="M14 2v6h6" />
                    </svg>
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{file.fileName}</p>
                        <p className="text-sm text-gray-500">PDF Document</p>
                    </div>
                </div>
            );
        }

        // Other file types
        return (
            <div className="flex items-center gap-3 text-gray-700">
                <svg className="h-12 w-12 flex-shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                    <path d="M14 2v6h6M16 13H8m8 4H8m2-8H8" />
                </svg>
                <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{file.fileName}</p>
                    <p className="text-sm text-gray-500">{file.fileType || 'File'}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full space-y-4">
            {/* Content Display */}
            <div className="rounded-2xl bg-white p-4 shadow-lg sm:p-6">{renderContent()}</div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
                {/* Copy Text Button - for text or both types */}
                {(clip.type === 'text' || clip.type === 'both') && (
                    <button
                        onClick={() => copyToClipboard(clip.type === 'text' ? clip.content : clip.textContent || '')}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-600 active:scale-95 sm:px-6 sm:text-base"
                    >
                        {copied ? (
                            <>
                                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                {/* Download Text Button - for text or both types */}
                {(clip.type === 'text' || clip.type === 'both') && (
                    <button
                        onClick={downloadTextAsFile}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-green-600 active:scale-95 sm:px-6 sm:text-base"
                    >
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                        Download Text
                    </button>
                )}

                {/* Download File Button - for file or both types */}
                {(clip.type === 'file' || clip.type === 'both') && (
                    <button
                        onClick={downloadAllFiles}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-purple-600 active:scale-95 sm:px-6 sm:text-base"
                    >
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                        {clip.files && clip.files.length > 1 ? `Download All (${clip.files.length})` : 'Download File'}
                    </button>
                )}
            </div>

            {/* Metadata */}
            <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600 sm:p-4 sm:text-sm">
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
