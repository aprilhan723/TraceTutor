import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "TraceTutor — TOEFL Reading Correction Sprint",
    template: "%s · TraceTutor",
  },
  description:
    "Tutor-verified daily mistake correction for the 2026 TOEFL Reading experience.",
  applicationName: "TraceTutor",
  openGraph: {
    title: "TraceTutor — Practice less randomly",
    description:
      "Ten focused minutes to stop repeating the same Reading mistake.",
    type: "website",
    siteName: "TraceTutor",
  },
  twitter: {
    card: "summary",
    title: "TraceTutor — Practice less randomly",
    description:
      "Ten focused minutes to stop repeating the same Reading mistake.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className="h-full scroll-smooth antialiased"
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
