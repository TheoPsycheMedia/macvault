"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface SearchBarProps {
  initialValue?: string;
  placeholder?: string;
  actionPath?: string;
  size?: "sm" | "lg";
}

export function SearchBar({
  initialValue = "",
  placeholder = "Search Mac tools, workflows, and categories...",
  actionPath = "/browse",
  size = "sm",
}: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialValue);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-2xl border border-white/12 bg-white/6 pl-11 pr-16 text-white placeholder:text-white/40 shadow-[0_16px_40px_rgba(0,0,0,0.2)] backdrop-blur-sm outline-none transition focus:border-cyan-300/55 focus:ring-2 focus:ring-cyan-400/20 ${
          size === "lg" ? "h-14 text-base" : "h-11 text-sm"
        }`}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-white/15 bg-black/35 px-2 py-0.5 text-[11px] font-medium text-white/65">
        ⌘K
      </span>
    </form>
  );
}
