import React from "react";
// 1. Import headers to get the nonce
import { headers } from "next/headers";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider"
import AuthProvider from "@/context/AuthProvider";
import InstallPWAButton from '@/components/InstallPWAButton';
import { Toaster } from "@/components/ui/sonner";
import { NetworkStatusHandler } from '@/components/NetworkStatusHandler';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import ServiceWorkerRegister from '@/components/serviceWorker'
import { GoogleTagManager } from '@next/third-parties/google'

console.log("Current NODE_ENV:", process.env.NODE_ENV);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["100", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["100", "900"],
});

// ✅ FIX 1: SEO Metadata
export const metadata: Metadata = {
  title: {
    template: "%s | DeepSession",
    default: "DeepSession - Flow State Companion",
  },
  description: "Master your flow state with DeepSession. A distraction-free focus timer, goal tracker, and productivity analytics dashboard for developers and creators.",
  keywords: ["productivity", "focus timer", "flow state", "pomodoro", "developer tools", "analytics"],

  authors: [{ name: "Trilok", url: "https://twitter.com/Dev_Trilok_07" }],
  creator: "Trilok",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://deepsession-mpt.vercel.app",
    title: "DeepSession - Flow State Companion",
    description: "Track your deep work sessions, manage goals, and analyze your productivity patterns.",
    siteName: "DeepSession",
  },
  twitter: {
    card: "summary_large_image",
    title: "DeepSession - Flow State Companion",
    description: "Master your flow state with DeepSession.",
    creator: "@Dev_Trilok_07",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  manifest: "/manifest.json",  // Next.js auto-generates this if you have manifest.ts
  appleWebApp: {
    capable: true,
    title: "DeepSession",
    statusBarStyle: "default",
  },
};

// ✅ FIX 2: Accessibility Friendly Viewport
export const viewport: Viewport = {
  // themeColor: "#0f172a", // Matches bg-slate-900
  themeColor: "#2c81fb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow zooming
  // userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  // 2. Retrieve the nonce from the request headers
  // Note: headers() is asynchronous in newer Next.js versions, await it if needed, 
  // but for many versions standard synchronous access works or it returns a ReadonlyHeaders.
  // We handle the potential null case safely.
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') || "";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ⚡ PERFORMANCE: Preconnect to critical third-party origins */}
        <link rel="preconnect" href="https://identitytoolkit.googleapis.com" />
        <link rel="preconnect" href="https://firebase.googleapis.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        {/* Optional: 1st Party Vercel Analytics */}
        <link rel="preconnect" href="https://vitals.vercel-insights.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 3. Pass nonce to ThemeProvider (Fixes inline script error) */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          nonce={nonce}
        >
          <Providers>
            <AuthProvider>
              <ServiceWorkerRegister />
              {children}
              <Toaster />
              <div className="fixed bottom-4 right-4 z-50">
                <InstallPWAButton />
              </div>
              {/* It will run the hook on the client-side */}
              <NetworkStatusHandler />
              <Analytics />
              <SpeedInsights />
            </AuthProvider>
          </Providers>
        </ ThemeProvider>
      </body>
      {/* Load GTM after the page is interactive */}
      <GoogleTagManager gtmId="G-BNSY4B3J3P" />
    </html>
  );
}
