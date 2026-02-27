"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";

import type { VoteType } from "@/lib/types";

interface VoteButtonsProps {
  slug: string;
  initialUpvotes: number;
  initialDownvotes: number;
  initialVoteCount: number;
  compact?: boolean;
}

export function VoteButtons({
  slug,
  initialUpvotes,
  initialDownvotes,
  initialVoteCount,
  compact = false,
}: VoteButtonsProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [currentVote, setCurrentVote] = useState<VoteType | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async (voteType: VoteType) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/tools/${slug}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ voteType }),
      });

      if (!response.ok) {
        throw new Error("Vote request failed");
      }

      const payload = (await response.json()) as {
        upvotes: number;
        downvotes: number;
        voteCount: number;
        currentVote: VoteType | null;
      };

      setUpvotes(payload.upvotes);
      setDownvotes(payload.downvotes);
      setVoteCount(payload.voteCount);
      setCurrentVote(payload.currentVote);
    } catch {
      setErrorMessage("Could not save vote");
    } finally {
      setIsSubmitting(false);
    }
  };

  const buttonClass = (type: VoteType) => {
    const isActive = currentVote === type;
    return `inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
      isActive
        ? "border-cyan-300/60 bg-cyan-400/15 text-cyan-100"
        : "border-white/10 bg-white/4 text-white/65 hover:border-white/20 hover:text-white"
    }`;
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleVote("up")}
          className={buttonClass("up")}
          disabled={isSubmitting}
          aria-label="Upvote"
        >
          <ThumbsUp className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          <span>{upvotes}</span>
        </button>
        <button
          type="button"
          onClick={() => handleVote("down")}
          className={buttonClass("down")}
          disabled={isSubmitting}
          aria-label="Downvote"
        >
          <ThumbsDown className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          <span>{downvotes}</span>
        </button>
        <span className="text-xs font-medium text-white/50">Net {voteCount}</span>
      </div>
      {errorMessage ? <p className="text-xs text-rose-300">{errorMessage}</p> : null}
    </div>
  );
}
