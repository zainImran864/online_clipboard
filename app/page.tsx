'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from '@/components/SplashScreen';
import Logo from '@/components/Logo';

interface ActionCard {
  title: string;
  description: string;
  href: string;
  cta: string;
  iconBg: string;
  accent: string;
  hoverBorder: string;
  icon: ReactNode;
}

const cards: ActionCard[] = [
  {
    title: 'Send File',
    description: 'Upload a file or write text to generate a share code.',
    href: '/send',
    cta: 'Start sharing',
    iconBg: 'bg-blue-600',
    accent: 'text-blue-600',
    hoverBorder: 'hover:border-blue-500',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    ),
  },
  {
    title: 'Read File',
    description: 'Enter a code to instantly view shared content.',
    href: '/read',
    cta: 'Enter a code',
    iconBg: 'bg-cyan-600',
    accent: 'text-cyan-600',
    hoverBorder: 'hover:border-cyan-500',
    icon: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </>
    ),
  },
  {
    title: 'Secret Share',
    description: 'Use a secret code to share large files up to 600MB.',
    href: '/secure',
    cta: 'Unlock upload',
    iconBg: 'bg-purple-600',
    accent: 'text-purple-600',
    hoverBorder: 'hover:border-purple-500',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    ),
  },
];

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const router = useRouter();

  const features = [
    { label: 'No login required', color: 'text-emerald-500' },
    { label: 'Real-time updates', color: 'text-blue-500' },
    { label: 'Auto-expires in 24h', color: 'text-purple-500' },
    { label: 'Files up to 600MB', color: 'text-fuchsia-500' },
  ];

  useEffect(() => {
    cards.forEach((card) => router.prefetch(card.href));
  }, [router]);

  const handleCardClick = (href: string) => {
    if (pendingHref) return;

    setPendingHref(href);
    router.push(href);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Splash overlays the home page while it loads, then fades away to
          reveal the already-rendered content beneath — no blank/black gap. */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* Header */}
      <header className="p-4 sm:p-6">
        <Logo size={40} className="sm:hidden" />
        <Logo size={48} className="hidden sm:flex" />
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl animate-fadeIn space-y-10 text-center sm:space-y-12">
          {/* Hero */}
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm sm:text-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              No login · No tracking · Share in seconds
            </span>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              Share Anything, <span className="text-blue-600">Instantly</span>
            </h1>
            <p className="mx-auto max-w-xl text-base text-slate-600 sm:text-lg">
              Upload files or write text, get a short code, and share it with anyone — across any device, no account needed.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
            {cards.map((card) => (
              <button
                key={card.href}
                onClick={() => handleCardClick(card.href)}
                onMouseEnter={() => router.prefetch(card.href)}
                disabled={pendingHref !== null}
                aria-busy={pendingHref === card.href}
                className={`group relative rounded-3xl border-2 border-slate-100 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl disabled:cursor-wait disabled:hover:translate-y-0 ${pendingHref && pendingHref !== card.href ? 'opacity-60' : ''} ${card.hoverBorder} sm:p-7`}
              >
                <div className="space-y-4">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${card.iconBg} shadow-md transition-transform duration-300 group-hover:scale-110`}>
                    {pendingHref === card.href ? (
                      <svg className="h-8 w-8 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    ) : (
                      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {card.icon}
                      </svg>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{card.title}</h2>
                    <p className="text-sm text-slate-600 sm:text-base">{card.description}</p>
                  </div>

                  <div className={`flex items-center gap-1.5 text-sm font-semibold ${card.accent}`}>
                    {pendingHref === card.href ? 'Opening...' : card.cta}
                    {pendingHref === card.href ? (
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                    ) : (
                      <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Feature strip */}
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-700 shadow-sm">
            {features.map((feature) => (
              <div key={feature.label} className="flex items-center gap-2">
                <svg className={`h-5 w-5 flex-shrink-0 ${feature.color}`} fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="pb-6 text-center text-xs text-slate-400">
        Pasteport — share anything, instantly.
      </footer>
    </div>
  );
}
