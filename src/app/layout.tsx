import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { PwaRegistration } from "@/components/pwa-registration";
import { getPublicAppUrl } from "@/lib/public-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getPublicAppUrl(),
  title: {
    default: "TraceTutor — TOEFL Reading Correction Sprint",
    template: "%s · TraceTutor",
  },
  description:
    "Tutor-verified mistake correction for the 2026 TOEFL Reading experience—not another question bank.",
  alternates: {
    canonical: "/",
  },
  applicationName: "TraceTutor",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TraceTutor",
  },
  openGraph: {
    title: "TraceTutor — Practice less randomly",
    description:
      "Ten focused minutes to stop repeating the same Reading mistake.",
    type: "website",
    siteName: "TraceTutor",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "TraceTutor correction trace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TraceTutor — Practice less randomly",
    description:
      "Ten focused minutes to stop repeating the same Reading mistake.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f2e9" },
    { media: "(prefers-color-scheme: dark)", color: "#25211f" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className="h-full scroll-smooth antialiased"
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-full flex-col">
        {children}
        <PwaRegistration />
      </body>
    </html>
  );
}
