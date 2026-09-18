import Link from 'next/link';

interface FooterProps {
  className?: string;
}

export default function Footer({ className = '' }: FooterProps) {
  return (
    <footer className={`mt-auto border-t border-slate-200/80 bg-white/70 py-8 backdrop-blur-xs ${className}`}>
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 text-xs text-slate-500 sm:flex-row sm:px-6">
        <div className="flex flex-col items-center gap-1 text-center sm:items-start sm:text-left">
          <p className="font-semibold text-slate-700">
            Pasteport <span className="font-normal text-slate-500">— Share anything, instantly.</span>
          </p>
          <p className="text-[11px] text-slate-400">
            Clips automatically purge after 24 hours. No account or personal data required.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600 sm:gap-6">
          <Link
            href="/privacy"
            className="font-medium transition-colors hover:text-blue-600 hover:underline"
          >
            Privacy Policy
          </Link>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <Link
            href="/terms"
            className="font-medium transition-colors hover:text-blue-600 hover:underline"
          >
            Terms of Service
          </Link>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <a
            href="mailto:abuse@zain-imran.com"
            className="font-medium transition-colors hover:text-blue-600 hover:underline"
          >
            Report Abuse / Takedown
          </a>
        </div>
      </div>
    </footer>
  );
}
