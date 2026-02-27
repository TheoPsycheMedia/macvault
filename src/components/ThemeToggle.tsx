"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    setIsLight(root.classList.contains("light"));
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextIsLight = !root.classList.contains("light");

    if (nextIsLight) {
      root.classList.add("light");
      localStorage.setItem("macvault-theme", "light");
    } else {
      root.classList.remove("light");
      localStorage.setItem("macvault-theme", "dark");
    }

    setIsLight(nextIsLight);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/6 text-white/80 transition hover:border-white/25 hover:text-white"
      aria-label="Toggle color theme"
      title="Toggle theme"
    >
      {isLight ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
    </button>
  );
}
