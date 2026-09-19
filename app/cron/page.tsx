'use client';

import React, { useState, useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { showToast } from '@/lib/appEvents';

interface Preset {
    name: string;
    expression: string;
    description: string;
}

const PRESETS: Preset[] = [
    { name: 'Every minute', expression: '* * * * *', description: 'Runs every single minute' },
    { name: 'Every 5 minutes', expression: '*/5 * * * *', description: 'Runs every 5th minute of every hour' },
    { name: 'Every 15 minutes', expression: '*/15 * * * *', description: 'Runs at minute 0, 15, 30, and 45' },
    { name: 'Every hour on the hour', expression: '0 * * * *', description: 'Runs at minute 0 of every hour' },
    { name: 'Every day at midnight', expression: '0 0 * * *', description: 'Runs daily at 00:00 UTC' },
    { name: 'Every day at 9:00 AM', expression: '0 9 * * *', description: 'Runs daily at 09:00 AM' },
    { name: 'Weekdays at 9:00 AM', expression: '0 9 * * 1-5', description: 'Runs Monday through Friday at 09:00 AM' },
    { name: 'Every Sunday at midnight', expression: '0 0 * * 0', description: 'Runs once a week on Sunday at 00:00' },
    { name: 'First day of every month', expression: '0 0 1 * *', description: 'Runs at 00:00 on day 1 of every month' },
];

function explainCronField(field: string, name: string): string {
    if (field === '*') return `every ${name}`;
    if (field.startsWith('*/')) return `every ${field.replace('*/', '')} ${name}s`;
    if (field.includes(',')) return `at ${name}s ${field}`;
    if (field.includes('-')) return `from ${name} ${field.split('-')[0]} to ${field.split('-')[1]}`;
    return `at ${name} ${field}`;
}

function explainCron(cronStr: string): string {
    const parts = cronStr.trim().split(/\s+/);
    if (parts.length !== 5) return 'Invalid cron expression (must have 5 fields)';

    const [min, hour, dom, mon, dow] = parts;

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let dowStr = '';
    if (dow !== '*') {
        if (dow === '1-5') dowStr = 'on Monday through Friday';
        else if (dow === '0' || dow === '7') dowStr = 'on Sunday';
        else if (daysOfWeek[Number(dow)]) dowStr = `on ${daysOfWeek[Number(dow)]}`;
        else dowStr = `on weekday ${dow}`;
    }

    const minExpl = explainCronField(min, 'minute');
    const hourExpl = explainCronField(hour, 'hour');
    const domExpl = dom === '*' ? '' : explainCronField(dom, 'day of month');
    const monExpl = mon === '*' ? '' : explainCronField(mon, 'month');

    return [minExpl, hourExpl, domExpl, monExpl, dowStr].filter(Boolean).join(', ');
}

function getNextExecutions(cronStr: string, count = 5, baseTimestamp = 0): Date[] {
    const parts = cronStr.trim().split(/\s+/);
    if (parts.length !== 5 || !baseTimestamp) return [];

    const [minPart, hourPart] = parts;
    const dates: Date[] = [];
    let current = new Date(baseTimestamp);
    current.setSeconds(0, 0);

    // Step forward minute by minute up to 10000 steps
    let steps = 0;
    while (dates.length < count && steps < 10080) {
        current = new Date(current.getTime() + 60000);
        steps++;

        const curMin = current.getMinutes();
        const curHour = current.getHours();

        // Check minute
        let minMatch = false;
        if (minPart === '*') minMatch = true;
        else if (minPart.startsWith('*/')) {
            const step = parseInt(minPart.slice(2), 10);
            if (curMin % step === 0) minMatch = true;
        } else if (parseInt(minPart, 10) === curMin) {
            minMatch = true;
        }

        // Check hour
        let hourMatch = false;
        if (hourPart === '*') hourMatch = true;
        else if (hourPart.startsWith('*/')) {
            const step = parseInt(hourPart.slice(2), 10);
            if (curHour % step === 0) hourMatch = true;
        } else if (parseInt(hourPart, 10) === curHour) {
            hourMatch = true;
        }

        if (minMatch && hourMatch) {
            dates.push(new Date(current));
        }
    }

    return dates;
}

function subscribeCronClock(callback: () => void) {
    const timer = setInterval(callback, 60000);
    return () => clearInterval(timer);
}

function getCronClockSnapshot() {
    return Date.now();
}

function getServerCronClockSnapshot() {
    return 1774000000000;
}

export default function CronGeneratorPage() {
    const router = useRouter();
    const now = useSyncExternalStore(subscribeCronClock, getCronClockSnapshot, getServerCronClockSnapshot);
    const [expression, setExpression] = useState<string>('*/15 9-17 * * 1-5');

    const explanation = useMemo(() => explainCron(expression), [expression]);
    const nextDates = useMemo(() => getNextExecutions(expression, 5, now), [expression, now]);

    const copyExpression = async () => {
        await navigator.clipboard.writeText(expression);
        showToast('Cron expression copied');
    };

    const shareViaPasteport = () => {
        const text = `Cron Schedule: ${expression}\nMeaning: ${explanation}\n\nNext Execution Times:\n${nextDates.map((d, i) => `${i + 1}. ${d.toUTCString()}`).join('\n')}`;
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pasteport_prefill_text', text);
            router.push('/send');
        }
    };

    const parts = expression.trim().split(/\s+/);

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Navbar />

            <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
                <div className="mx-auto max-w-5xl space-y-6">
                    {/* Header */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                                ⏰ Job Scheduler Engine
                            </div>
                            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                                Cron Expression Generator & Explainer
                            </h1>
                            <p className="text-xs text-slate-500 sm:text-sm">
                                Build, decode, and calculate upcoming execution dates for standard 5-field cron schedules.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={copyExpression}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95"
                            >
                                📋 Copy Cron
                            </button>
                            <button
                                onClick={shareViaPasteport}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-95"
                            >
                                🚀 Share via Pasteport
                            </button>
                        </div>
                    </div>

                    {/* Expression Display & Field Cards */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Cron Expression (5 fields)
                            </label>
                            <div className="mt-2 flex gap-3">
                                <input
                                    type="text"
                                    value={expression}
                                    onChange={(e) => setExpression(e.target.value)}
                                    placeholder="* * * * *"
                                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-lg font-black tracking-widest text-blue-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Breakdown Pills */}
                        <div className="grid grid-cols-5 gap-2 text-center">
                            {[
                                { name: 'Minute', val: parts[0] || '*' },
                                { name: 'Hour', val: parts[1] || '*' },
                                { name: 'Day (Month)', val: parts[2] || '*' },
                                { name: 'Month', val: parts[3] || '*' },
                                { name: 'Day (Week)', val: parts[4] || '*' },
                            ].map((f) => (
                                <div key={f.name} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{f.name}</p>
                                    <p className="font-mono text-base font-bold text-blue-700 mt-0.5">{f.val}</p>
                                </div>
                            ))}
                        </div>

                        {/* Human Meaning Banner */}
                        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                                Plain English Explanation
                            </span>
                            <p className="mt-1 text-sm font-bold text-blue-950 capitalize leading-relaxed">
                                &ldquo;{explanation}&rdquo;
                            </p>
                        </div>
                    </div>

                    {/* Presets Gallery */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Common Schedules
                        </span>
                        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                            {PRESETS.map((p) => (
                                <button
                                    key={p.name}
                                    onClick={() => { setExpression(p.expression); showToast(`Loaded ${p.name}`); }}
                                    className="flex flex-col text-left rounded-xl border border-slate-100 bg-slate-50 p-3 hover:border-blue-300 hover:bg-blue-50/30 transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-800">{p.name}</span>
                                        <span className="font-mono text-xs font-bold text-blue-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                                            {p.expression}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">{p.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Next Executions */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Upcoming Execution Times (UTC)
                        </span>

                        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden text-xs">
                            {nextDates.length === 0 ? (
                                <div className="p-4 text-center text-slate-400">
                                    No upcoming executions calculated within the search horizon.
                                </div>
                            ) : (
                                nextDates.map((date, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-white transition-colors">
                                        <span className="font-bold text-slate-500">Run #{idx + 1}</span>
                                        <span className="font-mono font-semibold text-slate-800">
                                            {date.toUTCString()}
                                        </span>
                                        <span className="text-[11px] text-blue-600 font-bold">
                                            {now > 0 ? `${Math.round((date.getTime() - now) / 60000)} min away` : ''}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
