import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PWAInstall from "@/components/PWAInstall";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://online-clipboard-beta.vercel.app";

export const metadata: Metadata = {
  title: "Pasteport - Share Anything, Instantly",
  description: "Share files, text, PDFs, and images instantly with a simple code. No login required.",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  keywords: [
    "online clipboard",
    "online clipboard app",
    "online clipboard free",
    "share files",
    "secure file sharing",
    "instant file sharing",
    "private file sharing",
    "share text",
    "instant text sharing",
    "copy paste online",
    "send text online",
    "clipboard sharing",
    "file transfer",
    "cross device sharing",
    "share between devices",
    "text sharing",
    "pdf sharing",
    "image sharing",
    "document sharing",
    "temporary file sharing",
    "one time share",
    "no login",
    "no signup",
    "no account",
    "share by code",
    "access code sharing",
    "short code sharing",
    "pwa clipboard",
    "progressive web app",
    "mobile clipboard",
    "share from phone",
    "share from desktop",
    "web clipboard",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon-192.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pasteport',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Pasteport',
    title: 'Pasteport - Share Anything, Instantly',
    description: 'Share files, text, PDFs, and images instantly with a simple code. No login required.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary',
    title: 'Pasteport - Share Anything, Instantly',
    description: 'Share files, text, PDFs, and images instantly with a simple code. No login required.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#2563EB',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#2563EB" />
        <meta name="msapplication-TileColor" content="#2563EB" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="google-site-verification" content="P4Vz3wA55Mrq9AEUqizMLh8BvGLTqOP6TOwknVTipds" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <PWAInstall />
      </body>
    </html>
  );
}
