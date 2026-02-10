'use client';

import { useEffect, useState } from 'react';

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already standalone
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      const isAppleStandalone = (window.navigator as any).standalone === true;
      return isStandaloneMode || isAppleStandalone;
    };

    if (checkStandalone()) {
      console.log('[PWA] App is running as PWA');
      setIsStandalone(true);
      setShowInstallBanner(false);
      return;
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const swUrl = `/sw.js?v=${Date.now()}`;
          const registration = await navigator.serviceWorker.register(swUrl, {
            scope: '/',
          });
          console.log('[PWA] Service Worker registered successfully:', registration);
        } catch (error) {
          console.error('[PWA] Service Worker registration failed:', error);
        }
      };

      // Register immediately and retry if needed
      registerSW();
      // Retry after a delay to catch late registrations
      setTimeout(registerSW, 2000);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('[PWA] App was installed');
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    };

    // Listen for display mode changes
    const mql = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: any) => {
      if (e.matches) {
        console.log('[PWA] Switched to standalone mode');
        setIsStandalone(true);
        setShowInstallBanner(false);
      }
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    mql.addListener(handleDisplayModeChange);

    // Show banner after a short delay to give browser time to trigger beforeinstallprompt
    const timer = setTimeout(() => {
      if (!deferredPrompt && !isStandalone) {
        // Fallback: show banner anyway if beforeinstallprompt didn't fire
        // but only if not on a page that explicitly handles it
        console.log('[PWA] No beforeinstallprompt, showing fallback banner');
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mql.removeListener(handleDisplayModeChange);
      clearTimeout(timer);
    };
  }, [deferredPrompt, isStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.warn('[PWA] No deferred prompt available');
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] User response to install prompt: ${outcome}`);

      if (outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error('[PWA] Install failed:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
  };

  // Don't show if already standalone or no banner to show
  if (!showInstallBanner || isStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] mx-auto max-w-md animate-slide-up">
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="h-10 w-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white">Install ClipShare</h3>
            <p className="text-sm text-blue-100">
              Install our app for quick access and offline use!
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-white opacity-70 hover:opacity-100"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 rounded-lg bg-white px-4 py-2 font-semibold text-blue-600 transition-transform hover:scale-105 active:scale-95"
          >
            Install Now
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-lg border border-white px-4 py-2 font-semibold text-white transition-opacity hover:opacity-80"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
