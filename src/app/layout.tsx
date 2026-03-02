import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const themeInitScript = `
(() => {
  const storedTheme = localStorage.getItem("macvault-theme");
  const root = document.documentElement;
  if (storedTheme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
})();
`;

export const metadata: Metadata = {
  title: {
    default: "MacVault — Curated Mac Tools",
    template: "%s | MacVault",
  },
  description: "Discover the best Mac tools, scored and curated for practical macOS workflows.",
  alternates: {
    types: {
      "application/rss+xml": "https://macvault.vercel.app/rss.xml",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <div className="min-h-screen">
          <Header />
          <main>{children}</main>
          <Footer />
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
