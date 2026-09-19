import type { Metadata } from 'next';
import Link from 'next/link';
import Logo from '@/components/Logo';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy - Pasteport',
  description: 'Understand how Pasteport protects your privacy, handles temporary data, enforces 24-hour auto-deletion, and processes ephemeral server logs.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'September 18, 2026';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4 sm:px-6 sm:py-5">
          <Link href="/" className="transition-opacity hover:opacity-90">
            <Logo size={42} />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:text-blue-600 active:scale-95 sm:text-sm"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Title Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              Legal & Privacy
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Last updated: {lastUpdated}
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              Pasteport (&quot;we&quot;, &quot;our&quot;, or &quot;the service&quot;) is committed to transparency and privacy.
              We built Pasteport so you can share text snippets, code, and files instantly across devices without creating accounts,
              logging in, or submitting personal identifiers. This policy outlines what minimal data is processed, how it is stored,
              when it is deleted, and your privacy rights under applicable regulations including the GDPR and CCPA.
            </p>
          </div>

          {/* Key Principles Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
                ✓
              </div>
              <h3 className="mt-3 font-bold text-slate-900">Zero Account Signup</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                No names, emails, passwords, or profile tracking. Anyone can create or view clips with a short code.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-bold">
                ⏳
              </div>
              <h3 className="mt-3 font-bold text-slate-900">24h Automatic Purge</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Uploaded content and database records automatically expire and are permanently wiped after 24 hours.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold">
                🛡️
              </div>
              <h3 className="mt-3 font-bold text-slate-900">Isolated & Safe</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Files are served from sandboxed origins and scripts are never executed in the browser.
              </p>
            </div>
          </div>

          {/* Policy Sections */}
          <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-10">
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                1. Information We Process
              </h2>
              <div className="space-y-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                <p>
                  Because Pasteport requires no account registration, we do not collect names, email addresses, phone numbers,
                  or billing details. The data processed consists solely of:
                </p>
                <ul className="list-disc space-y-1.5 pl-5 text-slate-700">
                  <li>
                    <strong className="text-slate-900">Uploaded Content:</strong> Text snippets, code, images, documents, or files you choose to upload.
                  </li>
                  <li>
                    <strong className="text-slate-900">Clip Metadata:</strong> File names, file sizes, MIME types, creation timestamps, expiration timestamps, and randomly generated 6-digit or 8-digit share codes.
                  </li>
                  <li>
                    <strong className="text-slate-900">Technical Server Logs:</strong> Standard HTTP request data (IP address, browser user agent, referral headers, and request timestamps) processed temporarily by edge routers and CDN infrastructure for network routing, security, rate limiting, and DDoS mitigation.
                  </li>
                </ul>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                2. Data Retention & Automatic Deletion
              </h2>
              <div className="space-y-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                  <p className="font-semibold">⚠️ All uploaded files and pastes are automatically purged from storage within 24 hours.</p>
                  <p className="mt-1 text-xs sm:text-sm text-amber-800">
                    Pasteport is an ephemeral clipboard tool, not a permanent file storage or backup repository.
                  </p>
                </div>
                <p>
                  When a clip reaches its 24-hour expiration threshold, automated background cleanup jobs purge the Firestore document metadata along with all associated files and oversized text objects from Cloudflare R2 object storage.
                </p>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                3. Third-Party Infrastructure & Service Providers
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                <p>
                  To provide fast, reliable, and scalable service, Pasteport utilizes the following industry-standard cloud providers:
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="font-bold text-slate-900">Vercel</h4>
                    <p className="mt-1 text-xs text-slate-600">
                      Hosts the Next.js application, executes serverless API routes, and serves edge network requests.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="font-bold text-slate-900">Google Cloud / Firebase Firestore</h4>
                    <p className="mt-1 text-xs text-slate-600">
                      Stores temporary clip metadata, share codes, expiration timestamps, and small inline text payloads.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="font-bold text-slate-900">Cloudflare R2</h4>
                    <p className="mt-1 text-xs text-slate-600">
                      Stores large files and oversized text payloads in isolated object storage buckets until expired or cleaned up.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="font-bold text-slate-900">AWS S3 Protocol SDK</h4>
                    <p className="mt-1 text-xs text-slate-600">
                      Used as the standard protocol interface to communicate securely with Cloudflare R2 object storage.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Each provider adheres to international privacy standards (including GDPR Standard Contractual Clauses and SOC 2 certifications).
                </p>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                4. Browser Storage & Cookies
              </h2>
              <div className="space-y-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                <p>
                  Pasteport does <strong>not</strong> use tracking cookies, advertising beacons, or third-party behavioral profiling.
                </p>
                <ul className="list-disc space-y-1.5 pl-5 text-slate-700">
                  <li>
                    <strong className="text-slate-900">Local Storage (`localStorage`):</strong> Used exclusively on your device for user convenience—for instance, remembering your most recent generated share code for easy access, which automatically expires after 24 hours.
                  </li>
                  <li>
                    <strong className="text-slate-900">Service Worker & Cache:</strong> When installed as a Progressive Web App (PWA), static application assets (CSS, scripts, icons) are cached locally on your device to support faster loading and offline UI availability.
                  </li>
                </ul>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                5. Desktop Application & CLI Privacy Guarantees
              </h2>
              <div className="space-y-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                <p>
                  Pasteport provides open-source native desktop clients (Electron) and command-line interfaces (<code className="rounded bg-slate-100 px-1 font-mono text-xs">pasteport-cli</code>). Both tools uphold our strict zero-tracking principles:
                </p>
                <ul className="list-disc space-y-1.5 pl-5 text-slate-700">
                  <li>
                    <strong className="text-slate-900">Zero Keystroke Logging or Background Monitoring:</strong> The desktop app registers the operating system shortcut (<kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">Ctrl+Shift+P</kbd> or <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">Cmd+Shift+P</kbd>) strictly to display the HUD window. It does not monitor typing, capture background keystrokes, or log non-Pasteport window titles.
                  </li>
                  <li>
                    <strong className="text-slate-900">Explicit Clipboard Access:</strong> The desktop client and CLI only read your clipboard when explicitly invoked (e.g. pressing the hotkey or running a command). Clipboard contents are never streamed or persisted in background daemon logs.
                  </li>
                  <li>
                    <strong className="text-slate-900">No Analytics or Telemetry:</strong> Neither the desktop daemon nor the CLI bundles telemetry, crash analytics trackers, or usage metrics. All requests connect directly over encrypted HTTPS to Pasteport servers.
                  </li>
                </ul>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 6 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                6. Content Security & Sandbox Isolation
              </h2>
              <div className="space-y-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                <p>
                  We implement robust sandboxing to prevent cross-site execution and protect users:
                </p>
                <ul className="list-disc space-y-1.5 pl-5 text-slate-700">
                  <li>
                    <strong>No Code Execution:</strong> Uploaded scripts, code files, HTML, and SVG files are rendered strictly as escaped plaintext inside read-only text containers or sandboxed elements.
                  </li>
                  <li>
                    <strong>Origin Isolation:</strong> Cloudflare R2 objects are hosted on distinct external origins with strict Same-Origin boundaries preventing uploaded files from interacting with your session.
                  </li>
                  <li>
                    <strong>Prohibited File Types:</strong> Native executable binaries (`.exe`, `.msi`, `.dll`, `.scr`, `.bat`, etc.) are prohibited from upload.
                  </li>
                </ul>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 7 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                7. Your Privacy Rights (GDPR & CCPA)
              </h2>
              <div className="space-y-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                <p>
                  Depending on your jurisdiction, you have legal rights regarding personal data:
                </p>
                <ul className="list-disc space-y-1.5 pl-5 text-slate-700">
                  <li>
                    <strong>Right to Access & Deletion:</strong> Because all clipboard content is purged automatically within 24 hours and we hold no user accounts, most content deletion is self-executing.
                  </li>
                  <li>
                    <strong>Immediate Removal:</strong> If you uploaded content by mistake or suspect unauthorized sharing, you may contact our takedown channel for immediate manual removal.
                  </li>
                  <li>
                    <strong>No Sale of Personal Data:</strong> Pasteport does not sell, rent, or monetize personal data or uploaded content.
                  </li>
                </ul>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 8 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                8. Contact & Inquiries
              </h2>
              <div className="space-y-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                <p>
                  For privacy questions, data concerns, or urgent takedown inquiries, please contact:
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-800">
                  <p className="font-mono text-sm">
                    <strong>Email:</strong>{' '}
                    <a href="mailto:abuse@zain-imran.com" className="text-blue-600 underline hover:text-blue-700">
                      abuse@zain-imran.com
                    </a>{' '}
                    / <a href="mailto:privacy@zain-imran.com" className="text-blue-600 underline hover:text-blue-700">
                      privacy@zain-imran.com
                    </a>
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
