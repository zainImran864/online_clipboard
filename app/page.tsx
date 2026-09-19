'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SplashScreen from '@/components/SplashScreen';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { showToast, startNavigation } from '@/lib/appEvents';

interface LastShare {
  code: string;
  url: string;
  createdAt: string;
}

const LAST_SHARE_TTL_MS = 24 * 60 * 60 * 1000;

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
    description: 'Upload a file, write text, or press Ctrl+V anywhere to share.',
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
    description: 'Enter a 6-digit code or scan QR to view and download offline.',
    href: '/read',
    cta: 'Enter code or scan QR',
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
    description: 'Use a secret code to share large files up to 600MB directly to R2.',
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

const devTools = [
  { href: '/json', name: 'JSON Formatter & Tree', icon: '🌲', desc: 'Auto-beautify, minify, validate & explore nested JSON' },
  { href: '/yaml', name: 'YAML ↔ JSON Converter', icon: '📑', desc: 'Convert seamlessly between YAML and JSON formats' },
  { href: '/sql', name: 'SQL Formatter & Beautifier', icon: '🗄️', desc: 'Beautify SQL queries, uppercase keywords, and clean indentation' },
  { href: '/regex', name: 'Regex Tester & Matcher', icon: '⚡', desc: 'Live regex tester with capture groups & common presets' },
  { href: '/uuid', name: 'UUID & GUID Generator', icon: '🎲', desc: 'Generate RFC 4122 (v4) and RFC 9562 (v7) UUIDs in bulk' },
  { href: '/timestamp', name: 'Unix Timestamp Converter', icon: '⏱️', desc: 'Convert Epoch seconds & ms to ISO-8601 & relative dates' },
  { href: '/jwt', name: 'JWT Debugger & Decoder', icon: '🔐', desc: 'Inspect header and payload claims with live expiry countdown' },
  { href: '/jwt-gen', name: 'JWT Generator & Signer', icon: '✍️', desc: 'Construct and sign HMAC-SHA256 tokens using Web Crypto' },
  { href: '/hash', name: 'Hash & Checksum Generator', icon: '🛡️', desc: 'Compute MD5, SHA-256, SHA-512 & HMAC for text and files' },
  { href: '/url', name: 'URL Parser & Query Editor', icon: '🔗', desc: 'Deconstruct URLs and live-edit query parameter keys & values' },
  { href: '/http-status', name: 'HTTP Status Code Reference', icon: '📖', desc: 'Encyclopedia of RFC & Cloudflare HTTP status codes' },
  { href: '/color', name: 'Color Converter & WCAG', icon: '🎨', desc: 'HEX, RGB, HSL converter with WCAG contrast checker' },
];

function getStoredLastShare(): LastShare | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem('lastShare');
  if (!stored) return null;

  try {
    const lastShare = JSON.parse(stored) as LastShare;
    const createdAt = new Date(lastShare.createdAt).getTime();

    if (!lastShare.code || !lastShare.url || Number.isNaN(createdAt) || Date.now() - createdAt >= LAST_SHARE_TTL_MS) {
      localStorage.removeItem('lastShare');
      return null;
    }

    return lastShare;
  } catch {
    localStorage.removeItem('lastShare');
    return null;
  }
}

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [lastShare, setLastShare] = useState<LastShare | null>(getStoredLastShare);
  const router = useRouter();

  const features = [
    { label: 'No login required', color: 'text-emerald-500' },
    { label: 'Real-time updates', color: 'text-blue-500' },
    { label: 'Custom auto-expiry (1–24h)', color: 'text-purple-500' },
    { label: 'Self-Destruct PIN wipe', color: 'text-rose-500' },
  ];

  useEffect(() => {
    cards.forEach((card) => router.prefetch(card.href));
  }, [router]);

  useEffect(() => {
    if (!lastShare) return;

    const remainingTime = LAST_SHARE_TTL_MS - (Date.now() - new Date(lastShare.createdAt).getTime());
    const timeout = window.setTimeout(() => {
      localStorage.removeItem('lastShare');
      setLastShare(null);
    }, Math.max(0, remainingTime));

    return () => window.clearTimeout(timeout);
  }, [lastShare]);

  const handleCardClick = (href: string) => {
    if (pendingHref) return;

    setPendingHref(href);
    startNavigation();
    router.push(href);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Splash overlays home page */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* Global Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-5xl animate-fadeIn space-y-10 text-center sm:space-y-12">
          {/* Hero */}
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm sm:text-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Cross-Device Sharing · Developer Toolkit · Zero Login
            </span>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              Cross-Device Sharing <span className="text-blue-600">+ Developer Toolkit</span>
            </h1>
            <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
              Transfer text, code, files, and screenshots across phones and PCs with 6-digit codes and QR scans. Plus 18 client-side developer utilities with direct 1-click sharing.
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

          {/* Last Share Pill */}
          {lastShare && (
            <div className="mx-auto max-w-xl rounded-2xl border border-blue-100 bg-white p-4 text-left shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Last share</p>
                  <p className="mt-1 font-mono text-lg font-extrabold tracking-widest text-blue-800">{lastShare.code}</p>
                  <p className="truncate text-xs text-slate-500">{lastShare.url}</p>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(lastShare.url);
                      showToast('Last share link copied');
                    }}
                    className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => handleCardClick(`/view/${lastShare.code}`)}
                    disabled={pendingHref !== null}
                    className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                  >
                    Open
                  </button>
                </div>
              </div>
            </div>
          )}

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

          {/* Desktop App & CLI Feature Banner */}
          <div className="grid gap-4 sm:grid-cols-2 pt-2 text-left">
            <Link
              href="/desktop"
              className="group flex items-center justify-between rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5 shadow-xs transition-all hover:border-blue-400 hover:shadow-md"
            >
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
                  <span>🖥️ Native Desktop App</span>
                </div>
                <h4 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600">
                  Pasteport for Windows, macOS & Linux
                </h4>
                <p className="text-xs text-slate-500">
                  Global hotkey <span className="font-mono font-bold text-blue-600">Ctrl+Shift+P</span>, background tray daemon, and instant clipboard sync.
                </p>
              </div>
              <span className="text-xl text-blue-600 transition-transform group-hover:translate-x-1">→</span>
            </Link>

            <Link
              href="/cli"
              className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-xs transition-all hover:border-slate-700 hover:shadow-md"
            >
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                  <span>⚡ Developer CLI Tool</span>
                </div>
                <h4 className="text-base font-extrabold text-white group-hover:text-emerald-400">
                  Command-Line Support
                </h4>
                <p className="text-xs text-slate-400">
                  <span className="font-mono text-emerald-400">pasteport send &quot;text&quot;</span> or pipe outputs directly from your terminal.
                </p>
              </div>
              <span className="text-xl text-emerald-400 transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>

          {/* Developer Utilities Suite Section */}
          <div className="space-y-4 pt-4 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                  🛠️ Developer Utilities Suite (18 Tools)
                </h3>
                <p className="text-xs text-slate-500">
                  Zero-server overhead, 100% client-side privacy-first web utilities.
                </p>
              </div>
              <Link
                href="/tools"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                <span>View All 18 Dev Tools</span>
                <span>→</span>
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {devTools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl transition-transform group-hover:scale-110">
                      {tool.icon}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">
                        {tool.name}
                      </h4>
                      <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                        {tool.desc}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center pt-2">
              <Link
                href="/tools"
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors shadow-2xs"
              >
                <span>🚀 Explore All 18 Developer Utilities in the Toolkit Hub</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* SEO Guide & Value Props Section */}
          <section className="space-y-6 pt-6 text-left border-t border-slate-200">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                Pasteport — Cross-Device Sharing + Developer Toolkit
              </h2>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                Pasteport unites frictionless cross-device sharing with an expansive suite of 18 client-side developer utilities. Move text, code snippets, photos, and files between devices with instant 6-digit codes or QR scans—no account required. Format JSON, convert YAML, test regular expressions, generate UUIDs, sign JWTs, and compute cryptographic hashes locally without data ever touching a server.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xl text-blue-600 mb-3">
                  🚀
                </div>
                <h3 className="text-sm font-bold text-slate-900">Zero Login Required</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  No email, no passwords, and zero tracking. Generate a 6-digit code or QR code to immediately fetch content on any other device.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-xl text-emerald-600 mb-3">
                  🔐
                </div>
                <h3 className="text-sm font-bold text-slate-900">4-Character PIN & Self-Destruct</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Protect sensitive data with a 4-character PIN. When enabled or changed at runtime, active readers lock in real time. Configure a Self-Destruct PIN for instant permanent wipes.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-xl text-purple-600 mb-3">
                  ⚡
                </div>
                <h3 className="text-sm font-bold text-slate-900">Ctrl + V & Live Updates</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Paste screenshots or text directly anywhere with <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] text-slate-700">Ctrl + V</kbd>. Enable Live Mode so readers watch edits update in real time.
                </p>
              </div>
            </div>

            {/* FAQ Accordion */}
            <div className="space-y-3 pt-4">
              <h3 className="text-lg font-bold text-slate-900">
                Frequently Asked Questions
              </h3>

              <div className="space-y-2">
                <details className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-colors open:border-blue-300">
                  <summary className="flex cursor-pointer items-center justify-between font-bold text-sm text-slate-800 hover:text-blue-600">
                    <span>How do I share my clipboard between phone and PC without logging in?</span>
                    <span className="ml-2 text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                    Open Pasteport (https://pasteport.zain-imran.com) on your first device, paste or type your content, and click &quot;Generate Share Code&quot;. Open the site on your second device, enter the 6-digit code or scan the QR code, and your content appears instantly.
                  </p>
                </details>

                <details className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-colors open:border-blue-300">
                  <summary className="flex cursor-pointer items-center justify-between font-bold text-sm text-slate-800 hover:text-blue-600">
                    <span>How does the 4-character PIN password protection work?</span>
                    <span className="ml-2 text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                    You can toggle on a 4-character PIN when composing a share or at runtime from the generated share card. Anyone opening the share must enter the 4-character PIN before seeing any content. If you turn on the PIN while a reader is currently viewing the share, their screen locks immediately in real time.
                  </p>
                </details>

                <details className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-colors open:border-blue-300">
                  <summary className="flex cursor-pointer items-center justify-between font-bold text-sm text-slate-800 hover:text-blue-600">
                    <span>What is the Self-Destruct PIN feature?</span>
                    <span className="ml-2 text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                    When generating a share, you can set an optional Self-Destruct PIN. The Self-Destruct button appears right below the code digits and only appears on the reader page if configured. When entered, all Firestore metadata and Cloudflare R2 files are instantly wiped, disappearing immediately from all reader screens.
                  </p>
                </details>

                <details className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-colors open:border-blue-300">
                  <summary className="flex cursor-pointer items-center justify-between font-bold text-sm text-slate-800 hover:text-blue-600">
                    <span>How long does Pasteport keep my files and clipboard data?</span>
                    <span className="ml-2 text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                    You choose the lifespan (1h, 3h, 6h, 12h, or 24h). Once expired, clips are immediately blocked and purged upon access or cleaned up via the daily cron job. No personal data or user accounts are ever retained.
                  </p>
                </details>

                <details className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-colors open:border-blue-300">
                  <summary className="flex cursor-pointer items-center justify-between font-bold text-sm text-slate-800 hover:text-blue-600">
                    <span>Can I paste screenshots directly with Ctrl + V?</span>
                    <span className="ml-2 text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                    Yes! Press <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] text-slate-700">Ctrl + V</kbd> anywhere on the page to paste clipboard images, screenshots, or copied text directly without needing to save a file first.
                  </p>
                </details>

                <details className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-colors open:border-blue-300">
                  <summary className="flex cursor-pointer items-center justify-between font-bold text-sm text-slate-800 hover:text-blue-600">
                    <span>Is there a native Desktop App for Windows, macOS, and Linux?</span>
                    <span className="ml-2 text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                    Yes! Pasteport Desktop runs as a lightweight background daemon in your system tray. Press the global hotkey <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] text-slate-700">Ctrl + Shift + P</kbd> (or <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] text-slate-700">Cmd + Shift + P</kbd> on macOS) anywhere in your operating system to summon the Quick Share HUD, auto-capture your clipboard, and generate an instant share code in ~200ms. Visit <Link href="/desktop" className="text-blue-600 font-medium underline hover:text-blue-700">Pasteport Desktop</Link> to download binaries for Windows (.exe), macOS (.dmg), or Linux (.AppImage).
                  </p>
                </details>

                <details className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-colors open:border-blue-300">
                  <summary className="flex cursor-pointer items-center justify-between font-bold text-sm text-slate-800 hover:text-blue-600">
                    <span>How do I install and use the Pasteport Command-Line Interface (CLI)?</span>
                    <span className="ml-2 text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                    You can run the CLI instantly via <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] text-emerald-600">npx pasteport-zisphere</code>, install via <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] text-emerald-600">npm install -g pasteport-zisphere</code>, or install via Python <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] text-emerald-600">pip install pasteport-zisphere</code>. Running <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] text-emerald-600">pasteport</code> opens an interactive 1-2-3-4 numbered menu for Standard Share, Secret Share (600 MB), Retrieval, and Wipe. You can also pipe commands directly: <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] text-emerald-600">git diff | pasteport</code> or <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] text-emerald-600">pasteport send ./build.zip</code>. Visit the <Link href="/cli" className="text-blue-600 font-medium underline hover:text-blue-700">CLI Documentation</Link> for full syntax.
                  </p>
                </details>

                <details className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-colors open:border-blue-300">
                  <summary className="flex cursor-pointer items-center justify-between font-bold text-sm text-slate-800 hover:text-blue-600">
                    <span>Can I download files directly into my terminal from a share link or code?</span>
                    <span className="ml-2 text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                    Yes! The CLI accepts both clean 6-digit codes and full web URLs created on the website. For example: <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] text-emerald-600">pasteport get https://pasteport.zain-imran.com/view/482193</code> extracts the code, verifies any PIN, and streams the binary file directly to your local working directory with the original filename preserved.
                  </p>
                </details>

                <details className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-colors open:border-blue-300">
                  <summary className="flex cursor-pointer items-center justify-between font-bold text-sm text-slate-800 hover:text-blue-600">
                    <span>What is Secret Share and how does the 600 MB limit work?</span>
                    <span className="ml-2 text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                    While Standard Share handles daily text and documents up to 10 MB, Secret Share on <Link href="/secure" className="text-blue-600 font-medium underline hover:text-blue-700">/secure</Link> enables transfers of large archives and datasets up to 600 MB. Senders generate a one-time 8-digit access code that issues a direct-to-R2 presigned upload URL, bypassing serverless body limits. The CLI supports this flow via Option 2 or <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] text-purple-600">pasteport secret &lt;8-digit-code&gt; &lt;file&gt;</code>.
                  </p>
                </details>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
