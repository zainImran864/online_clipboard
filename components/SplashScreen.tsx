'use client';

import React, { useEffect, useState } from 'react';
import Logo from './Logo';

interface SplashScreenProps {
    onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
    const [launched, setLaunched] = useState(false);

    useEffect(() => {
        // After a brief brand moment, launch the paper plane + slide the cover up.
        const launchTimer = setTimeout(() => setLaunched(true), 1200);
        // Unmount the splash once the plane has flown and the cover has cleared.
        const completeTimer = setTimeout(() => onComplete(), 2350);

        return () => {
            clearTimeout(launchTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    return (
        <>
            {/* Cover panel — slides up off the top to reveal the home page beneath. */}
            <div
                className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-50 transition-transform duration-[1100ms] ease-in-out ${
                    launched ? '-translate-y-full' : 'translate-y-0'
                }`}
            >
                <div
                    className={`transition-all duration-500 ${
                        launched ? '-translate-y-6 opacity-0' : 'animate-pulse opacity-100'
                    }`}
                >
                    <Logo size={100} />
                </div>
            </div>

            {/* Paper plane — flies from the bottom of the screen up and off the top. */}
            <div
                className={`pointer-events-none fixed left-1/2 top-1/2 z-[60] text-blue-600 ${
                    launched ? 'animate-plane-fly' : 'hidden'
                }`}
            >
                <svg
                    width="72"
                    height="72"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="drop-shadow-lg"
                    aria-hidden="true"
                >
                    <path
                        d="M22 2 11 13"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M22 2 15 22l-4-9-9-4 20-7Z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        </>
    );
}
