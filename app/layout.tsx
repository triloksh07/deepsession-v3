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
// import { SkeletonProvider } from "react-skeletonify";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeepSession",
  description: "Boost your productivity with AI-driven focus sessions, personalized insights, and seamless task management.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "DeepSession-v3",
    statusBarStyle: "default",
  },
};

// IMPROVEMENT: Add viewport settings for theme-color and responsive design
export const viewport: Viewport = {
  themeColor: "#0f172a", // Matches bg-slate-900
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
                {children}
                <Toaster />
                <div className="fixed bottom-4 right-4 z-50">
                  <InstallPWAButton />
                </div>
                {/* It will run the hook on the client-side */}
                <NetworkStatusHandler />
                <ServiceWorkerRegister />
                {/* 4. Pass nonce to Analytics (if it supports it, though often it auto-detects) */}
                <Analytics />
                <SpeedInsights />
              </AuthProvider>
            </Providers>
          </ ThemeProvider>
        </body>
      </html>
  );
}
