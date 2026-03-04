"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SearchBarProps {
  initialValue?: string;
  placeholder?: string;
  actionPath?: string;
  size?: "sm" | "lg";
  primaryShortcutTarget?: boolean;
}

export function SearchBar({
  initialValue = "",
  placeholder = "Search Mac tools, workflows, and categories...",
  actionPath = "/browse",
  size = "sm",
  primaryShortcutTarget = true,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const nextQuery = query.trim();
    const url = nextQuery
      ? `${actionPath}?search=${encodeURIComponent(nextQuery)}`
      : actionPath;

    router.push(url);
  };

  return (
    <form onSubmit={onSubmit} className="relative w-full">
      <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        aria-label="Search tools"
        data-primary-search={primaryShortcutTarget ? "true" : undefined}
        className={`w-full rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] pl-12 pr-20 text-[color:var(--text)] placeholder:text-[color:var(--text-muted)] shadow-[0_1px_2px_rgba(26,26,26,0.05)] outline-none transition duration-300 focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent-soft)] ${
          size === "lg" ? "h-14 text-base" : "h-11 text-sm"
        }`}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-2.5 py-0.5 text-[11px] font-medium text-[color:var(--text-muted)]">
        ⌘K
      </span>
    </form>
  );
}
