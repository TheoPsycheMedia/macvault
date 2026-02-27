"use client";

import { Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { SearchBar } from "@/components/SearchBar";
import { ThemeToggle } from "@/components/ThemeToggle";

const navLinks = [
  { href: "/browse", label: "Browse" },
  { href: "/categories", label: "Categories" },
  { href: "/newsletter", label: "Newsletter" },
  { href: "/about", label: "About" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--border)] bg-[color:var(--surface)]/95 backdrop-blur-sm">
      <div className="editorial-shell flex h-20 items-center justify-between gap-5">
        <Link
          href="/"
          className="text-xl font-medium tracking-[-0.01em] text-[color:var(--text)]"
          onClick={() => setIsOpen(false)}
        >
          MacVault
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[color:var(--text-muted)] transition-colors duration-300 hover:text-[color:var(--text)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/browse"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--text-muted)] transition-colors duration-300 hover:text-[color:var(--text)]"
            aria-label="Browse and search tools"
          >
            <Search className="h-4 w-4" />
          </Link>

          <ThemeToggle />

          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--text-muted)] transition-colors duration-300 hover:text-[color:var(--text)] md:hidden"
            aria-expanded={isOpen}
            aria-label="Toggle mobile menu"
          >
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="border-t border-[color:var(--border)] md:hidden">
          <div className="editorial-shell space-y-4 py-5">
            <nav className="grid gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="rounded-2xl px-4 py-2.5 text-sm text-[color:var(--text-muted)] transition-colors duration-300 hover:bg-[color:var(--bg-soft)] hover:text-[color:var(--text)]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <SearchBar size="sm" />
          </div>
        </div>
      ) : null}
    </header>
  );
}
