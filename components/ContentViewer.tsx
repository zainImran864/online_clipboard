'use client';

import React, { useState, useEffect } from 'react';
import { Clip, SharedFile } from '@/hooks/useClipboard';

interface ContentViewerProps {
    clip: Clip;
}

/* ---------- file classification ---------- */

const CODE_EXTENSIONS = [
    'html', 'htm', 'css', 'js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'py', 'java',
    'c', 'cpp', 'h', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'sql', 'sh',
    'bash', 'yml', 'yaml', 'md', 'txt', 'conf', 'csv', 'cvs',
];
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogv', 'mov', 'avi', 'mkv', 'mpeg', 'mpg', '3gp', 'flv', 'wmv', 'm4v'];
const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'opus', 'weba', 'mid', 'midi'];

const ext = (name: string) => name.split('.').pop()?.toLowerCase() || '';

const isImage = (f: SharedFile) => f.fileType?.startsWith('image/') || IMAGE_EXTENSIONS.includes(ext(f.fileName));
const isVideo = (f: SharedFile) => f.fileType?.startsWith('video/') || VIDEO_EXTENSIONS.includes(ext(f.fileName));
const isAudio = (f: SharedFile) => f.fileType?.startsWith('audio/') || AUDIO_EXTENSIONS.includes(ext(f.fileName));
const isMedia = (f: SharedFile) => isImage(f) || isVideo(f) || isAudio(f);
// Code / text files render inline on the platform, so they get the dedicated
// full-width "Live Preview" section instead of the two-column area.
const isCodeFile = (f: SharedFile) =>
    CODE_EXTENSIONS.includes(ext(f.fileName)) ||
    f.fileType?.startsWith('text/') ||
    f.fileType?.includes('javascript') ||
    f.fileType?.includes('json');

function languageLabel(fileName: string) {
    const labels: Record<string, string> = {
        js: 'JavaScript', jsx: 'React JSX', ts: 'TypeScript', tsx: 'React TSX',
        py: 'Python', html: 'HTML', htm: 'HTML', css: 'CSS', json: 'JSON', xml: 'XML',
        java: 'Java', c: 'C', cpp: 'C++', cs: 'C#', php: 'PHP', rb: 'Ruby', go: 'Go',
        rs: 'Rust', swift: 'Swift', kt: 'Kotlin', sql: 'SQL', sh: 'Shell', bash: 'Shell',
        yml: 'YAML', yaml: 'YAML', md: 'Markdown', txt: 'Text', csv: 'CSV', conf: 'Config',
    };
    return labels[ext(fileName)] || 'Text';
}

function documentLabel(f: SharedFile) {
    const e = ext(f.fileName);
    if (['doc', 'docx'].includes(e) || f.fileType?.includes('wordprocessingml') || f.fileType === 'application/msword') return 'Word Document';
    if (['xls', 'xlsx'].includes(e) || f.fileType?.includes('spreadsheetml') || f.fileType === 'application/vnd.ms-excel') return 'Excel Spreadsheet';
    if (['ppt', 'pptx'].includes(e) || f.fileType?.includes('presentationml') || f.fileType === 'application/vnd.ms-powerpoint') return 'PowerPoint Presentation';
    if (['tar', 'gz', 'tgz'].includes(e) || f.fileType?.includes('tar') || f.fileType?.includes('gzip')) return 'TAR/GZ Archive';
    if (e === 'rar' || f.fileType?.includes('rar')) return 'RAR Archive';
    if (e === 'zip' || f.fileType?.includes('zip')) return 'ZIP Archive';
    if (e === 'pdf' || f.fileType === 'application/pdf') return 'PDF Document';
    return f.fileType || 'File';
}

function fileEmoji(f: SharedFile) {
    const e = ext(f.fileName);
    if (['zip', 'rar', 'tar', 'gz', 'tgz'].includes(e)) return '🗜️';
    if (e === 'pdf') return '📕';
    if (['doc', 'docx'].includes(e)) return '📘';
    if (['xls', 'xlsx'].includes(e)) return '📗';
    if (['ppt', 'pptx'].includes(e)) return '📙';
    return '📄';
}

function formatBytes(bytes?: number) {
    if (!bytes || bytes <= 0) return '';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
}

function triggerDownload(url: string, fileName: string) {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/* ---------- Live Preview (code / text opens here) ---------- */

// Fetches and shows one code/text file in a bounded, scrollable dark pane.
function CodePane({ file }: { file: SharedFile }) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                let text: string;
                if (file.url.startsWith('data:')) {
                    text = atob(file.url.split(',')[1] || '');
                } else {
                    text = await (await fetch(file.url)).text();
                }
                if (!cancelled) setContent(text);
            } catch {
                if (!cancelled) setContent('// Failed to load file content');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [file.url]);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* ignore */ }
    };

    return (
        <div>
            {/* Bar: filename + actions */}
            <div className="flex items-center justify-between border-b border-slate-700/60 bg-slate-900 px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-100">
                    <span className="truncate">{file.fileName}</span>
                    <span className="flex-shrink-0 text-xs font-normal text-slate-500">· opened on DropCode</span>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                    <button onClick={copy} className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 transition-colors hover:bg-slate-600">
                        {copied ? '✓ Copied' : '📋 Copy'}
                    </button>
                    <button onClick={() => triggerDownload(file.url, file.fileName)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-500">
                        ⬇ Download
                    </button>
                </div>
            </div>
            {/* Bounded, scrollable body keeps large files from breaking the layout */}
            <div className="max-h-[360px] overflow-auto bg-slate-900 p-4">
                {loading ? (
                    <p className="text-sm text-slate-500">Loading…</p>
                ) : (
                    <pre className="whitespace-pre font-mono text-[13px] leading-relaxed text-slate-100">
                        <code>{content}</code>
                    </pre>
                )}
            </div>
        </div>
    );
}

function LivePreview({ files }: { files: SharedFile[] }) {
    const [active, setActive] = useState(0);
    const current = files[Math.min(active, files.length - 1)];

    const downloadAll = () => {
        files.forEach((f, i) => setTimeout(() => triggerDownload(f.url, f.fileName), i * 300));
    };

    return (
        <div>
            {/* Section heading */}
            <div className="mb-3 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-extrabold tracking-wide text-indigo-700">
                    OPENS HERE
                </span>
                <h2 className="text-base font-extrabold text-gray-800">🖥️ Live Preview</h2>
                <p className="text-xs text-gray-400">· Code &amp; text files render right here — switch tabs to view each</p>
                {files.length > 1 && (
                    <button
                        onClick={downloadAll}
                        className="ml-auto flex-shrink-0 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
                    >
                        ⬇ Download all ({files.length})
                    </button>
                )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-[0_20px_46px_rgba(2,6,23,0.28)]">
                {/* Tabs */}
                <div className="flex flex-wrap items-center gap-1 bg-slate-950/60 px-2.5 pt-2">
                    {files.map((f, i) => (
                        <button
                            key={i}
                            onClick={() => setActive(i)}
                            className={`flex items-center gap-2 rounded-t-lg px-3.5 py-2 text-xs transition-colors ${i === active
                                ? 'bg-slate-900 font-bold text-slate-100'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            <span className="max-w-[160px] truncate">📄 {f.fileName}</span>
                            <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-blue-300">{languageLabel(f.fileName)}</span>
                        </button>
                    ))}
                </div>
                <CodePane key={current.url} file={current} />
                <div className="bg-slate-950/60 py-1.5 text-center text-[11px] text-slate-500">
                    ↕ scroll to see more · bounded height keeps the page tidy
                </div>
            </div>
        </div>
    );
}

/* ---------- media preview (image / video / audio) ---------- */

function MediaPreview({ file }: { file: SharedFile }) {
    if (isImage(file)) {
        return (
            <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={file.url} alt={file.fileName} className="max-h-80 w-full object-contain" />
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <p className="truncate text-sm font-semibold text-gray-700">{file.fileName}</p>
                    <button onClick={() => triggerDownload(file.url, file.fileName)} className="flex-shrink-0 text-sm font-bold text-blue-600 hover:text-blue-700">⬇ Download</button>
                </div>
            </div>
        );
    }
    if (isVideo(file)) {
        return (
            <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-2">
                <video controls src={file.url} className="max-h-80 w-full rounded-lg bg-black">Your browser does not support video.</video>
                <div className="flex items-center justify-between gap-2 px-1 pt-2">
                    <p className="truncate text-sm font-semibold text-gray-700">{file.fileName}</p>
                    <button onClick={() => triggerDownload(file.url, file.fileName)} className="flex-shrink-0 text-sm font-bold text-blue-600 hover:text-blue-700">⬇ Download</button>
                </div>
            </div>
        );
    }
    // audio
    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-gray-700">🎵 {file.fileName}</p>
                <button onClick={() => triggerDownload(file.url, file.fileName)} className="flex-shrink-0 text-sm font-bold text-blue-600 hover:text-blue-700">⬇ Download</button>
            </div>
            <audio controls src={file.url} className="w-full">Your browser does not support audio.</audio>
        </div>
    );
}

/* ---------- main ---------- */

export default function ContentViewer({ clip }: ContentViewerProps) {
    const [copied, setCopied] = useState(false);

    const files = clip.files || [];
    const codeFiles = files.filter((f) => !isMedia(f) && isCodeFile(f));
    const mediaFiles = files.filter(isMedia);
    const downloadFiles = files.filter((f) => !isMedia(f) && !isCodeFile(f));

    const sharedText = clip.type === 'text' ? clip.content : clip.textContent;
    const hasText = !!(sharedText && sharedText.trim().length > 0);
    const hasRightColumn = mediaFiles.length > 0 || downloadFiles.length > 0;
    const twoCol = hasText && hasRightColumn;

    const copyText = async () => {
        try {
            await navigator.clipboard.writeText(sharedText || '');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* ignore */ }
    };

    const downloadText = () => {
        if (!sharedText) return;
        triggerDownload('data:text/plain;charset=utf-8,' + encodeURIComponent(sharedText), 'clipboard-content.txt');
    };

    // Files shown in the right-hand card (media previews + download-only rows).
    // Code/text files have their own Live Preview section with its own download-all.
    const cardFiles = [...mediaFiles, ...downloadFiles];
    const downloadAll = () => {
        cardFiles.forEach((f, i) => setTimeout(() => triggerDownload(f.url, f.fileName), i * 300));
    };

    return (
        <div className="space-y-5 sm:space-y-6">
            {/* Full-width Live Preview for code / text */}
            {codeFiles.length > 0 && <LivePreview files={codeFiles} />}

            {/* Text + files */}
            <div className={twoCol ? 'grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start' : 'space-y-5'}>
                {/* Shared text */}
                {hasText && (
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lg sm:p-6">
                        <h3 className="mb-3 flex items-center gap-2 text-base font-extrabold text-gray-800">📝 Shared Text</h3>
                        <div className="max-h-96 overflow-auto rounded-xl border border-slate-100 bg-slate-50 p-4">
                            <pre className="whitespace-pre-wrap break-words font-sans text-sm text-gray-800">{sharedText}</pre>
                        </div>
                        <div className="mt-4 flex gap-3">
                            <button onClick={copyText} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-600 active:scale-95">
                                {copied ? '✓ Copied' : '📋 Copy Text'}
                            </button>
                            <button onClick={downloadText} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-green-600 active:scale-95">
                                ⬇ Download Text
                            </button>
                        </div>
                    </div>
                )}

                {/* Files: media previews + download-only list */}
                {hasRightColumn && (
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lg sm:p-6">
                        <h3 className="mb-1 flex items-center gap-2 text-base font-extrabold text-gray-800">
                            📎 Files
                            {downloadFiles.length > 0 && mediaFiles.length === 0 && (
                                <span className="text-xs font-medium text-gray-400">· not previewable here</span>
                            )}
                        </h3>
                        <p className="mb-4 text-xs text-gray-400">
                            {cardFiles.length} {cardFiles.length === 1 ? 'file' : 'files'} attached
                        </p>

                        <div className="space-y-3">
                            {/* Media previews */}
                            {mediaFiles.map((f, i) => <MediaPreview key={`m${i}`} file={f} />)}

                            {/* Download-only rows */}
                            {downloadFiles.map((f, i) => (
                                <div key={`d${i}`} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-lg">
                                        {fileEmoji(f)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold text-gray-700">{f.fileName}</p>
                                        <p className="text-xs text-gray-400">
                                            {documentLabel(f)}{formatBytes(f.fileSize) && ` · ${formatBytes(f.fileSize)}`}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => triggerDownload(f.url, f.fileName)}
                                        className="flex-shrink-0 rounded-lg border border-indigo-100 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
                                    >
                                        ⬇ Download
                                    </button>
                                </div>
                            ))}
                        </div>

                        {cardFiles.length > 1 && (
                            <button
                                onClick={downloadAll}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-500/30 transition-all hover:brightness-105 active:scale-95"
                            >
                                ⬇ Download all ({cardFiles.length} files)
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Metadata */}
            <div className="rounded-xl bg-white/60 p-3 text-xs text-gray-500 sm:p-4 sm:text-sm">
                <p><span className="font-semibold">Created:</span> {clip.createdAt.toLocaleString()}</p>
                {clip.expiresAt && <p><span className="font-semibold">Expires:</span> {clip.expiresAt.toLocaleString()}</p>}
            </div>
        </div>
    );
}
