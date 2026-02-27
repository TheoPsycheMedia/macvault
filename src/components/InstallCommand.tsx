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
    <div className="rounded-2xl border border-white/10 bg-[color:var(--surface-elevated)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
      <h3 className="font-display text-xl font-semibold text-white">Install</h3>
      <p className="mt-2 text-sm text-white/70">{installInstructions}</p>

      {brewCommand ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <code className="flex-1 overflow-x-auto rounded-xl border border-white/12 bg-black/35 px-4 py-3 text-sm text-cyan-100">
            {brewCommand}
          </code>
          <button
            type="button"
            onClick={copyCommand}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/8 px-4 py-3 text-sm font-medium text-white transition hover:border-white/25"
          >
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {isCopied ? "Copied" : "Copy"}
          </button>
        </div>
      ) : null}

      <Link
        href={websiteUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/8 px-4 py-3 text-sm font-medium text-white transition hover:border-white/25"
      >
        <Download className="h-4 w-4" />
        Open download page
      </Link>
    </div>
  );
}
