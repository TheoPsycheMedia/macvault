"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const SEQUENCE_WINDOW_MS = 1400;
const NAVIGATION_SHORTCUTS: Record<string, string> = {
  h: "/",
  b: "/browse",
  n: "/newsletter",
};

type SearchTarget = HTMLInputElement | HTMLTextAreaElement;

function isTypingContext(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
    return true;
  }

  if (target.isContentEditable) {
    return true;
  }

  return target.closest("[contenteditable='true'], [contenteditable='plaintext-only']") !== null;
}

function isVisible(element: HTMLElement): boolean {
  if (element.hidden || element.getAttribute("aria-hidden") === "true") {
    return false;
  }

  if (element.getClientRects().length === 0) {
    return false;
  }

  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
}

function findPrimarySearchInput(): SearchTarget | null {
  const selector = [
    "[data-primary-search='true']",
    "input[type='search']",
    "input[name='search']",
    "input[id='search']",
  ].join(", ");

  const candidates = document.querySelectorAll<SearchTarget>(selector);

  for (const candidate of candidates) {
    if (candidate.disabled || candidate.readOnly) {
      continue;
    }

    if (!isVisible(candidate)) {
      continue;
    }

    return candidate;
  }

  return null;
}

export function GlobalKeyboardShortcuts() {
  const router = useRouter();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sequenceRef = useRef<{ starter: "g" | null; startedAt: number }>({
    starter: null,
    startedAt: 0,
  });

  useEffect(() => {
    if (isHelpOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isHelpOpen]);

  useEffect(() => {
    const clearSequence = () => {
      sequenceRef.current = {
        starter: null,
        startedAt: 0,
      };
    };

    const focusPrimarySearch = () => {
      const target = findPrimarySearchInput();
      if (!target) {
        return;
      }

      target.focus();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const now = Date.now();
      if (
        sequenceRef.current.starter &&
        now - sequenceRef.current.startedAt > SEQUENCE_WINDOW_MS
      ) {
        clearSequence();
      }

      if (event.key === "Escape" && isHelpOpen) {
        event.preventDefault();
        setIsHelpOpen(false);
        clearSequence();
        return;
      }

      if (event.repeat) {
        return;
      }

      if (isTypingContext(event.target)) {
        clearSequence();
        return;
      }

      const key = event.key.toLowerCase();
      const hasModKey = event.metaKey || event.ctrlKey;
      const hasAnyModifier = hasModKey || event.altKey;

      if (hasModKey && key === "k") {
        event.preventDefault();
        focusPrimarySearch();
        clearSequence();
        return;
      }

      if (isHelpOpen) {
        return;
      }

      if (!hasAnyModifier && event.key === "?") {
        event.preventDefault();
        setIsHelpOpen(true);
        clearSequence();
        return;
      }

      if (!hasAnyModifier && event.key === "/") {
        const searchInput = findPrimarySearchInput();
        if (searchInput) {
          event.preventDefault();
          searchInput.focus();
        }
        clearSequence();
        return;
      }

      if (hasAnyModifier) {
        clearSequence();
        return;
      }

      if (sequenceRef.current.starter === "g") {
        const route = NAVIGATION_SHORTCUTS[key];
        if (route) {
          event.preventDefault();
          router.push(route);
          clearSequence();
          return;
        }

        if (key === "g") {
          sequenceRef.current.startedAt = now;
          return;
        }

        clearSequence();
        return;
      }

      if (key === "g") {
        sequenceRef.current = {
          starter: "g",
          startedAt: now,
        };
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isHelpOpen, router]);

  if (!isHelpOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/45 px-4 pt-20 sm:items-center sm:pt-0"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setIsHelpOpen(false);
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-help-title"
        aria-describedby="shortcuts-help-description"
        className="w-full max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.35)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="shortcuts-help-title"
              className="text-lg font-medium tracking-[-0.01em] text-[color:var(--text)]"
            >
              Keyboard shortcuts
            </h2>
            <p id="shortcuts-help-description" className="mt-1 text-sm text-[color:var(--text-muted)]">
              Navigate and search quickly.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setIsHelpOpen(false)}
            aria-label="Close keyboard shortcuts help"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--text-muted)] transition duration-200 hover:text-[color:var(--text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="mt-5 grid gap-2 text-sm text-[color:var(--text)]">
          <li className="flex items-center justify-between rounded-xl bg-[color:var(--bg-soft)] px-3 py-2">
            <span>Go home</span>
            <div className="flex items-center gap-1">
              <kbd className="rounded border border-[color:var(--border)] bg-[color:var(--surface)] px-1.5 py-0.5 font-mono text-xs">
                g
              </kbd>
              <kbd className="rounded border border-[color:var(--border)] bg-[color:var(--surface)] px-1.5 py-0.5 font-mono text-xs">
                h
              </kbd>
            </div>
          </li>
          <li className="flex items-center justify-between rounded-xl bg-[color:var(--bg-soft)] px-3 py-2">
            <span>Go browse</span>
            <div className="flex items-center gap-1">
              <kbd className="rounded border border-[color:var(--border)] bg-[color:var(--surface)] px-1.5 py-0.5 font-mono text-xs">
                g
              </kbd>
              <kbd className="rounded border border-[color:var(--border)] bg-[color:var(--surface)] px-1.5 py-0.5 font-mono text-xs">
                b
              </kbd>
            </div>
          </li>
          <li className="flex items-center justify-between rounded-xl bg-[color:var(--bg-soft)] px-3 py-2">
            <span>Go newsletter</span>
            <div className="flex items-center gap-1">
              <kbd className="rounded border border-[color:var(--border)] bg-[color:var(--surface)] px-1.5 py-0.5 font-mono text-xs">
                g
              </kbd>
              <kbd className="rounded border border-[color:var(--border)] bg-[color:var(--surface)] px-1.5 py-0.5 font-mono text-xs">
                n
              </kbd>
            </div>
          </li>
          <li className="flex items-center justify-between rounded-xl bg-[color:var(--bg-soft)] px-3 py-2">
            <span>Focus search</span>
            <kbd className="rounded border border-[color:var(--border)] bg-[color:var(--surface)] px-1.5 py-0.5 font-mono text-xs">
              /
            </kbd>
          </li>
          <li className="flex items-center justify-between rounded-xl bg-[color:var(--bg-soft)] px-3 py-2">
            <span>Open this panel</span>
            <kbd className="rounded border border-[color:var(--border)] bg-[color:var(--surface)] px-1.5 py-0.5 font-mono text-xs">
              ?
            </kbd>
          </li>
          <li className="flex items-center justify-between rounded-xl bg-[color:var(--bg-soft)] px-3 py-2">
            <span>Close panel</span>
            <kbd className="rounded border border-[color:var(--border)] bg-[color:var(--surface)] px-1.5 py-0.5 font-mono text-xs">
              Esc
            </kbd>
          </li>
        </ul>
      </div>
    </div>
  );
}
