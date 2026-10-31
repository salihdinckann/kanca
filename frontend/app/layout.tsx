import type { Metadata } from "next";
import { Geist, Geist_Mono, Unbounded } from "next/font/google";
import { GOOGLE_VERIFICATION, OWNER, SITE_URL } from "@/lib/site";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

const description =
  "Kanca, yapay zeka destekli ücretsiz phishing (oltalama) link tarayıcı. SMS, e-posta veya WhatsApp'tan gelen şüpheli linki yapıştır; risk skorunu ve nedenlerini tıklamadan önce gör.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Kanca – Phishing Link Tarayıcı | Kancayı yemeden önce gör",
  description,
  keywords: [
    "Kanca",
    "phishing link kontrol",
    "oltalama link tarayıcı",
    "şüpheli link kontrol",
    "link güvenli mi",
    "dolandırıcılık SMS link",
    "phishing detector",
    "phishing URL scanner",
    OWNER.name,
  ],
  authors: [{ name: OWNER.name, url: OWNER.github }],
  creator: OWNER.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Kanca",
    title: "Kanca – Kancayı yemeden önce gör",
    description,
    locale: "tr_TR",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kanca – Kancayı yemeden önce gör",
    description,
  },
  verification: GOOGLE_VERIFICATION ? { google: GOOGLE_VERIFICATION } : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${geistSans.variable} ${geistMono.variable} ${unbounded.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
