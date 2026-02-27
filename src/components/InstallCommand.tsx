"use client";

import { Check, Copy, Download } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface InstallCommandProps {
  brewCommand?: string;
  websiteUrl: string;
  installInstructions: string;
}

export function InstallCommand({
  brewCommand,
  websiteUrl,
  installInstructions,
}: InstallCommandProps) {
  const [isCopied, setIsCopied] = useState(false);

  const copyCommand = async () => {
    if (!brewCommand) {
      return;
    }

    await navigator.clipboard.writeText(brewCommand);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1200);
  };

  return (
    <section className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
      <h3 className="text-[24px] font-medium tracking-[-0.01em] text-[color:var(--text)]">Install</h3>
      <p className="mt-2 text-sm text-[color:var(--text-muted)]">{installInstructions}</p>

      {brewCommand ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
            Homebrew Command
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <code className="flex-1 overflow-x-auto rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-4 py-3 text-sm text-[color:var(--text)]">
              {brewCommand}
            </code>
            <button
              type="button"
              onClick={copyCommand}
              className="inline-flex h-[50px] items-center justify-center gap-2 rounded-full border border-[color:var(--border)] px-4 text-sm font-medium text-[color:var(--text)] transition duration-300 hover:bg-[color:var(--bg-soft)]"
            >
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {isCopied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      ) : null}

      <Link
        href={websiteUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-5 py-2.5 text-sm font-medium text-[color:var(--text)] transition duration-300 hover:bg-[color:var(--bg-soft)]"
      >
        <Download className="h-4 w-4" />
        Open Download Page
      </Link>
    </section>
  );
}
