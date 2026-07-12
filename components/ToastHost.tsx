'use client';

import { useEffect, useState } from 'react';
import { TOAST_EVENT } from '@/lib/appEvents';

export default function ToastHost() {
    const [message, setMessage] = useState('');

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined;

        const handleToast = (event: Event) => {
            const nextMessage = event instanceof CustomEvent ? String(event.detail || '') : '';
            if (!nextMessage) return;

            setMessage(nextMessage);
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => setMessage(''), 2200);
        };

        window.addEventListener(TOAST_EVENT, handleToast);
        return () => {
            window.removeEventListener(TOAST_EVENT, handleToast);
            if (timer) clearTimeout(timer);
        };
    }, []);

    if (!message) return null;

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex justify-center px-4">
            <div className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-xl">
                {message}
            </div>
        </div>
    );
}
