'use client';

import React, { useCallback, useState } from 'react';
import { validateFile } from '@/lib/fileHandler';

interface FileUploadProps {
    onFileSelect: (files: File[]) => void;
    disabled?: boolean;
    multiple?: boolean;
    /** 'box' = large dashed drop area (default); 'compact' = slim horizontal strip. */
    variant?: 'box' | 'compact';
}

const ACCEPT =
    '.txt,.pdf,.jpg,.jpeg,.png,.gif,.webp,.svg,.zip,.rar,.tar,.gz,.tgz,.conf,.csv,.cvs,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp3,.wav,.ogg,.oga,.m4a,.aac,.flac,.opus,.weba,.mid,.midi,.mp4,.webm,.ogv,.mov,.avi,.mkv,.mpeg,.mpg,.3gp,.flv,.wmv,.m4v';

export default function FileUpload({ onFileSelect, disabled = false, multiple = true, variant = 'box' }: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
            setError(null);

            if (disabled) return;

            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const files = Array.from(e.dataTransfer.files);
                const validFiles: File[] = [];
                const errors: string[] = [];

                files.forEach(file => {
                    const validation = validateFile(file);
                    if (validation.valid) {
                        validFiles.push(file);
                    } else {
                        errors.push(`${file.name}: ${validation.error}`);
                    }
                });

                if (errors.length > 0) {
                    setError(errors.join(', '));
                }

                if (validFiles.length > 0) {
                    onFileSelect(validFiles);
                }
            }
        },
        [onFileSelect, disabled]
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            e.preventDefault();
            setError(null);

            if (disabled) return;

            if (e.target.files && e.target.files.length > 0) {
                const files = Array.from(e.target.files);
                const validFiles: File[] = [];
                const errors: string[] = [];

                files.forEach(file => {
                    const validation = validateFile(file);
                    if (validation.valid) {
                        validFiles.push(file);
                    } else {
                        errors.push(`${file.name}: ${validation.error}`);
                    }
                });

                if (errors.length > 0) {
                    setError(errors.join(', '));
                }

                if (validFiles.length > 0) {
                    onFileSelect(validFiles);
                }
            }
        },
        [onFileSelect, disabled]
    );

    if (variant === 'compact') {
        return (
            <div className="w-full">
                <div
                    className={`relative flex items-center gap-4 rounded-2xl border-2 border-dashed p-4 transition-all ${dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-indigo-200 bg-gradient-to-b from-indigo-50/60 to-white hover:border-indigo-300'
                        } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        onChange={handleChange}
                        disabled={disabled}
                        multiple={multiple}
                        accept={ACCEPT}
                    />
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-sm font-bold text-gray-700">Drag &amp; drop files, or attach</h4>
                        <p className="truncate text-xs text-gray-400">
                            Text, code, archives, Office, PDF, images, audio &amp; video · up to 10MB
                        </p>
                    </div>
                    <span className="pointer-events-none ml-auto hidden flex-shrink-0 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700 sm:inline-block">
                        Browse files
                    </span>
                </div>
                {error && (
                    <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                        {error}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-full">
            <div
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all ${dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                    } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    onChange={handleChange}
                    disabled={disabled}
                    multiple={multiple}
                    accept={ACCEPT}
                />
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="rounded-full bg-blue-600 p-4">
                        <svg
                            className="h-8 w-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-gray-700">
                            Drop your files here or click to browse
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                            Supports: Text, archives, Office, PDF, Images • up to 10MB per file
                        </p>
                    </div>
                </div>
            </div>
            {error && (
                <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {error}
                </div>
            )}
        </div>
    );
}

