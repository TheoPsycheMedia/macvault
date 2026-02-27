import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Sora({
  variable: "--font-display",
  subsets: ["latin"],
});

const themeInitScript = `
(() => {
  const storedTheme = localStorage.getItem('macvault-theme');
  const root = document.documentElement;
  if (storedTheme === 'light') {
    root.classList.add('light');
  } else {
    root.classList.remove('light');
  }
})();
`;

export const metadata: Metadata = {
  title: {
    default: "MacVault",
    template: "%s · MacVault",
  },
  description: "Discover the best open-source Mac tools, scored and curated.",
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
      <body className={`${bodyFont.variable} ${displayFont.variable} antialiased`}>
        <div className="min-h-screen">
          <Header />
          <main className="page-enter">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
