'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from '@/components/SplashScreen';
import Logo from '@/components/Logo';

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <header className="p-4 sm:p-6">
        <Logo size={40} className="sm:hidden" />
        <Logo size={50} className="hidden sm:flex" />
      </header>

      {/* Main Content */}
      <main className="flex min-h-[calc(100vh-100px)] items-center justify-center px-4 py-6 sm:min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-2xl animate-fadeIn space-y-6 text-center sm:space-y-8">
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl md:text-5xl">
              Share Anything,{' '}
              <span className="text-blue-600">
                Instantly
              </span>
            </h1>
            <p className="text-base text-gray-600 sm:text-lg md:text-xl">
              Upload files or write text, get a code, and share with anyone. No login required.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {/* Send File Card */}
            <button
              onClick={() => router.push('/send')}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-100 sm:p-8"
            >
              <div className="absolute inset-0 bg-blue-500 opacity-0 transition-opacity group-hover:opacity-10" />
              <div className="relative space-y-3 sm:space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 sm:h-20 sm:w-20">
                  <svg
                    className="h-8 w-8 text-white sm:h-10 sm:w-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">Send File</h2>
                  <p className="mt-2 text-sm text-gray-600 sm:text-base">
                    Upload a file or write text to generate a share code
                  </p>
                </div>
              </div>
            </button>

            {/* Read File Card */}
            <button
              onClick={() => router.push('/read')}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-100 sm:p-8"
            >
              <div className="absolute inset-0 bg-blue-600 opacity-0 transition-opacity group-hover:opacity-10" />
              <div className="relative space-y-3 sm:space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-600 sm:h-20 sm:w-20">
                  <svg
                    className="h-8 w-8 text-white sm:h-10 sm:w-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">Read File</h2>
                  <p className="mt-2 text-sm text-gray-600 sm:text-base">
                    Enter a code to view shared content
                  </p>
                </div>
              </div>
            </button>

            {/* Secret Share Card */}
            <button
              onClick={() => router.push('/secure')}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-100 sm:p-8"
            >
              <div className="absolute inset-0 bg-purple-600 opacity-0 transition-opacity group-hover:opacity-10" />
              <div className="relative space-y-3 sm:space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-600 sm:h-20 sm:w-20">
                  <svg
                    className="h-8 w-8 text-white sm:h-10 sm:w-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">Secret Share</h2>
                  <p className="mt-2 text-sm text-gray-600 sm:text-base">
                    Use a secret code to share large files up to 600MB
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Features */}
          <div className="grid gap-3 text-xs sm:gap-4 sm:text-sm text-gray-600 md:grid-cols-3">
            <div className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0 text-green-500 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>No Login Required</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0 text-blue-500 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Real-time Updates</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0 text-purple-500 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>24 Hour Access</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
