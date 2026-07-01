import React from 'react';

interface LogoProps {
    size?: number;
    className?: string;
}

export default function Logo({ size = 60, className = '' }: LogoProps) {
    return (
        <div className={`flex flex-row items-center gap-2 sm:gap-3 ${className}`}>
            <div
                className="relative flex flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-lg"
                style={{ width: size, height: size }}
            >
                <svg
                    width={size * 0.7}
                    height={size * 0.7}
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* "P" monogram */}
                    <path
                        d="M23 48V18h13a9 9 0 0 1 0 18h-9"
                        stroke="white"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    {/* Paper plane (send) */}
                    <path d="M45 21l-12 4 4.5 2 1.5 4.5z" fill="white" />
                </svg>
            </div>
            <div className="flex min-w-0 flex-col">
                <h1 className="whitespace-nowrap text-xl font-bold text-blue-700 sm:text-2xl">
                    Pasteport
                </h1>
                <p className="hidden whitespace-nowrap text-xs text-gray-500 sm:block">Share anything, instantly</p>
            </div>
        </div>
    );
}
