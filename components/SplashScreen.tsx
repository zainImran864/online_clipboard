'use client';

import React, { useEffect, useState } from 'react';
import Logo from './Logo';

interface SplashScreenProps {
    onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        // Start fade out after 2 seconds
        const timer = setTimeout(() => {
            setFadeOut(true);
        }, 2000);

        // Complete after fade out animation
        const completeTimer = setTimeout(() => {
            onComplete();
        }, 2500);

        return () => {
            clearTimeout(timer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-blue-50 transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'
                }`}
        >
            <div className="animate-pulse">
                <Logo size={100} />
            </div>
        </div>
    );
}
