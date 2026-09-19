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
    default: "Pasteport — Cross-Device Sharing + Developer Toolkit",
    template: "%s | Pasteport — Cross-Device Sharing + Developer Toolkit",
  },
  description:
    "Free cross-device sharing platform and developer toolkit. Transfer text, code, files, and screenshots across devices with 6-digit codes and QR scans. Includes 18 client-side developer utilities: JSON Formatter, YAML Converter, SQL Formatter, Regex Tester, UUID Generator, JWT Debugger & Signer, Hash Generator, Unix Timestamp Converter, and more.",
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
    "cross device sharing",
    "developer toolkit",
    "online clipboard",
    "developer utilities",
    "share clipboard between devices",
    "json formatter",
    "yaml to json",
    "sql formatter",
    "regex tester",
    "uuid generator",
    "unix timestamp converter",
    "jwt debugger",
    "jwt generator",
    "hash generator sha256",
    "url parser",
    "http status codes",
    "color converter wcag",
    "html formatter",
    "diff checker",
    "base64 encoder",
    "markdown live editor",
    "cron expression generator",
    "lorem ipsum generator",
    "mock json generator",
    "temporary file sharing",
    "send text from phone to pc",
    "send text from pc to phone",
    "clipboard without login",
    "qr code clipboard",
    "self destruct clipboard",
    "pin protected clipboard",
    "pasteport",
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
    title: 'Pasteport — Cross-Device Sharing + Developer Toolkit',
    description:
      'Cross-device clipboard sharing paired with 18 client-side developer utilities. Share text, code, files, and screenshots instantly with 6-digit codes and QR scans. No login required.',
    url: siteUrl,
    images: [
      {
        url: `${siteUrl}/icon-512.png`,
        width: 512,
        height: 512,
        alt: 'Pasteport — Cross-Device Sharing + Developer Toolkit',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pasteport — Cross-Device Sharing + Developer Toolkit',
    description:
      'Cross-device clipboard sharing paired with 18 client-side developer utilities. Share text, code, files, and screenshots instantly with 6-digit codes and QR scans. No login required.',
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
