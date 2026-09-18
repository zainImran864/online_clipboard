import type { Metadata } from 'next';
import Link from 'next/link';
import Logo from '@/components/Logo';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service - Pasteport',
  description: 'Read the Terms of Service for Pasteport, including Acceptable Use Policies, limitations of liability, 24-hour auto-deletion rules, and abuse takedown procedures.',
};

export default function TermsOfServicePage() {
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
              Terms of Use
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Terms of Service
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Last updated: {lastUpdated}
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              Welcome to Pasteport. By accessing or using our website, applications, or API endpoints (collectively, the &quot;Service&quot;),
              you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </div>

          {/* Quick Notice Banner */}
          <div className="rounded-2xl border border-red-200 bg-red-50/70 p-5 shadow-xs">
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-red-600 text-sm font-bold text-white">
                !
              </span>
              <div className="space-y-1 text-xs sm:text-sm text-red-950">
                <p className="font-bold">Zero Tolerance for Illegal Activity</p>
                <p className="leading-relaxed text-red-900">
                  Pasteport strictly forbids malware, CSAM, phishing, copyright infringement, and illicit content.
                  Infringing or abusive files will be immediately purged, and repeat abuse will result in IP blocks and reports to competent law enforcement agencies.
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Terms */}
          <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-10">
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                1. Description of the Service
              </h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                Pasteport is a free, ephemeral online clipboard and temporary file transfer utility designed for quick peer-to-peer sharing across devices using short access codes.
                No registration or account creation is required.
              </p>
            </section>

            <hr className="border-slate-100" />

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                2. Acceptable Use Policy (AUP)
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                <p>
                  You are solely responsible for all files, code, text, and materials you upload, transmit, or share via the Service.
                  You explicitly agree <strong>NOT</strong> to use Pasteport to:
                </p>
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <ul className="list-disc space-y-2 pl-5 text-slate-700">
                    <li>
                      <strong className="text-slate-900">Malicious Software:</strong> Distribute viruses, trojans, worms, ransomware, spyware, rootkits, phishing kits, exploit scripts, or corrupted payloads.
                    </li>
                    <li>
                      <strong className="text-slate-900">Child Exploitation:</strong> Upload, store, or share Child Sexual Abuse Material (CSAM) or any form of child sexual exploitation. Any occurrence will be reported immediately to the National Center for Missing & Exploited Children (NCMEC) and law enforcement.
                    </li>
                    <li>
                      <strong className="text-slate-900">Intellectual Property Infringement:</strong> Upload pirated media, cracked software, unlicensed proprietary data, or content that violates trademark, trade secret, or copyright laws.
                    </li>
                    <li>
                      <strong className="text-slate-900">Fraud & Identity Theft:</strong> Share stolen credit card data, unauthorized access credentials, social security numbers, or deceptive phishing sites.
                    </li>
                    <li>
                      <strong className="text-slate-900">Infrastructure Abuse & DoS:</strong> Launch denial-of-service (DoS/DDoS) attacks, automated bot abuse, scraping, or attempts to bypass rate limits or storage quotas.
                    </li>
                    <li>
                      <strong className="text-slate-900">Executable Binaries:</strong> Upload desktop executables (such as <code className="rounded bg-slate-200 px-1 text-xs">.exe</code>, <code className="rounded bg-slate-200 px-1 text-xs">.msi</code>, <code className="rounded bg-slate-200 px-1 text-xs">.dll</code>, <code className="rounded bg-slate-200 px-1 text-xs">.com</code>, <code className="rounded bg-slate-200 px-1 text-xs">.scr</code>, <code className="rounded bg-slate-200 px-1 text-xs">.vbs</code>, <code className="rounded bg-slate-200 px-1 text-xs">.jar</code>, <code className="rounded bg-slate-200 px-1 text-xs">.lnk</code>).
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                3. Ephemeral Storage & 24-Hour Auto-Deletion
              </h2>
              <div className="space-y-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                <p>
                  <strong>Pasteport is not a permanent storage or backup service.</strong>
                </p>
                <p>
                  All clips, uploaded files, and stored text automatically expire and are permanently wiped by our cleanup infrastructure within 24 hours of creation.
                  You acknowledge that you must maintain independent backups of all files you share. We are not responsible for any lost, deleted, or unrecoverable content.
                </p>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                4. Content Moderation & Takedown Policy
              </h2>
              <div className="space-y-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                <p>
                  We reserve the right (but assume no obligation) to monitor, inspect, refuse, or delete any content or terminate access to any clip code at our sole discretion, without notice or liability.
                </p>
                <p>
                  If you are a copyright owner, rights holder, or representative seeking the removal of infringing or abusive content, please submit a takedown notice containing the 6-digit code or share link to:
                </p>
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-blue-950">
                  <p className="font-semibold">Abuse & Takedown Contact:</p>
                  <p className="mt-1 font-mono text-sm">
                    <strong>Email:</strong>{' '}
                    <a href="mailto:abuse@zain-imran.com" className="text-blue-700 underline hover:text-blue-800">
                      abuse@zain-imran.com
                    </a>
                  </p>
                  <p className="mt-1 text-xs text-blue-800">
                    Please provide the exact share code/URL, description of the material, and basis for removal. Valid notices are processed promptly.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                5. Disclaimer of Warranties
              </h2>
              <div className="space-y-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                <p className="uppercase text-xs font-bold tracking-wider text-slate-500">Provided &quot;As Is&quot;</p>
                <p>
                  THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND,
                  EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                  UPTIME, DATA INTEGRITY, SECURITY, OR NON-INFRINGEMENT.
                </p>
                <p>
                  WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR HARMFUL COMPONENTS.
                </p>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 6 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                6. Limitation of Liability
              </h2>
              <div className="space-y-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL PASTEPORT, ITS CREATORS, CONTRIBUTORS,
                  OR HOSTING PROVIDERS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
                  INCLUDING BUT NOT LIMITED TO LOSS OF DATA, REVENUE, PROFITS, GOODWILL, OR BUSINESS INTERRUPTION ARISING OUT OF OR IN CONNECTION
                  WITH YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                </p>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 7 */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                7. Modifications to Terms
              </h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                We reserve the right to modify or replace these Terms of Service at any time. Changes become effective immediately upon posting.
                Your continued use of the Service following any updates constitutes your acceptance of the revised terms.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
