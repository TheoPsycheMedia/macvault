import Link from "next/link";

import { SearchBar } from "@/components/SearchBar";
import { ThemeToggle } from "@/components/ThemeToggle";

const navLinks = [
  { href: "/browse", label: "Browse" },
  { href: "/categories", label: "Categories" },
  { href: "/newsletter", label: "Newsletter" },
  { href: "/about", label: "About" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[color:var(--surface-elevated)]/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="group inline-flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 via-blue-400 to-indigo-500 text-sm font-bold text-slate-950 shadow-[0_10px_30px_rgba(56,189,248,0.35)]">
            M
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-white">
            MacVault
          </span>
        </Link>

        <div className="hidden min-w-0 flex-1 md:block">
          <SearchBar size="sm" />
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-white/75 transition hover:bg-white/8 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <ThemeToggle />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pb-3 md:hidden sm:px-6 lg:px-8">
        <SearchBar size="sm" />
      </div>
    </header>
  );
}
