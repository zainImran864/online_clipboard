'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NAVIGATION_START_EVENT } from '@/lib/appEvents';

export default function NavigationProgress() {
    const pathname = usePathname();
    const [active, setActive] = useState(false);

    useEffect(() => {
        const handleStart = () => setActive(true);
        window.addEventListener(NAVIGATION_START_EVENT, handleStart);
        return () => window.removeEventListener(NAVIGATION_START_EVENT, handleStart);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setActive(false), 0);
        return () => clearTimeout(timer);
    }, [pathname]);

    if (!active) return null;

    return (
        <div className="pointer-events-none fixed left-0 top-0 z-[100] h-1 w-full overflow-hidden bg-blue-100">
            <div className="h-full w-1/2 animate-route-progress rounded-r-full bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600" />
        </div>
    );
}
