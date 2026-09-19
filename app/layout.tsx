import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PWAInstall from "@/components/PWAInstall";
import NavigationProgress from "@/components/NavigationProgress";
import ToastHost from "@/components/ToastHost";
import JsonLd from "@/components/JsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://pasteport.zain-imran.com";

export const metadata: Metadata = {
  title: {
    default: "Pasteport — Free Online Clipboard & Cross-Device File Sharing",
    template: "%s | Pasteport Online Clipboard",
  },
  description:
    "Free online clipboard to share text, code, files, PDFs, and images instantly across devices with a 6-digit code. No login required. Features 4-character PIN protection, real-time live sync, and instant self-destruct.",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  authors: [{ name: "Zain Imran", url: "https://zain-imran.com" }],
  creator: "Zain Imran",
  publisher: "Pasteport",
  applicationName: "Pasteport",
  category: "productivity",
  keywords: [
    "online clipboard",
    "clipboard online",
    "online clipboard free",
    "online clipboard app",
    "clipboard sharing",
    "share clipboard",
    "share clipboard between devices",
    "cross device clipboard",
    "clipboard sync across devices",
    "send text from phone to pc",
    "send text from pc to phone",
    "clipboard without login",
    "paste online no login",
    "temporary clipboard",
    "temporary file sharing",
    "instant text sharing",
    "copy paste online",
    "share text by 6 digit code",
    "file transfer without login",
    "pin protected clipboard",
    "self destruct clipboard",
    "private pastebin",
    "pastebin alternative",
    "pasteport",
    "ctrl v screenshot paste",
    "markdown live editor pdf",
    "pwa online clipboard",
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
    title: 'Pasteport — Free Online Clipboard & Cross-Device Sharing',
    description:
      'Share text, code, files, PDFs, and images instantly across devices with a 6-digit code. No login required. Features 4-character PIN protection, real-time sync, and instant self-destruct.',
    url: siteUrl,
    images: [
      {
        url: `${siteUrl}/icon-512.png`,
        width: 512,
        height: 512,
        alt: 'Pasteport — Online Clipboard & Cross-Device Sharing',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pasteport — Free Online Clipboard & Cross-Device Sharing',
    description:
      'Share text, code, files, PDFs, and images instantly across devices with a 6-digit code. No login required. Features 4-character PIN protection, live updates, and self-destruct.',
    images: [`${siteUrl}/icon-512.png`],
    creator: '@zain_imran',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Knowledge Base" />
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
        suppressHydrationWarning
      >
        <JsonLd />
        <NavigationProgress />
        {children}
        <PWAInstall />
        <ToastHost />
      </body>
    </html>
  );
}
