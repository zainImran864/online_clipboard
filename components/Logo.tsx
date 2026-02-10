import React from 'react';

interface LogoProps {
    size?: number;
    className?: string;
}

export default function Logo({ size = 60, className = '' }: LogoProps) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div
                className="relative flex items-center justify-center rounded-2xl bg-blue-600 shadow-lg"
                style={{ width: size, height: size }}
            >
                <svg
                    width={size * 0.6}
                    height={size * 0.6}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M9 12H15"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <path
                        d="M9 16H12"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
            </div>
            <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-blue-700">
                    ClipShare
                </h1>
                <p className="text-xs text-gray-500">Share anything, instantly</p>
            </div>
        </div>
    );
}
