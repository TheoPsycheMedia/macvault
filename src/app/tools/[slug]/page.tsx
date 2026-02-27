import { CalendarClock, GitFork, Scale, Star, Vote } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import { InstallCommand } from "@/components/InstallCommand";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { ToolHero } from "@/components/ToolHero";
import { VoteButtons } from "@/components/VoteButtons";
import { getToolBySlug, listSimilarTools } from "@/lib/repository";
import { formatCompactNumber, formatDate, formatRelativeDate } from "@/lib/utils";

const SITE_URL = "https://macvault.vercel.app";

interface ToolDetailPageProps {
  params: Promise<{ slug: string }>;
}

function summarizeForMeta(value: string) {
  const trimmed = value.trim();
  if (trimmed.length <= 160) {
    return trimmed;
  }

  return `${trimmed.slice(0, 157)}...`;
}

function toAbsoluteUrl(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${SITE_URL}${value}`;
  }

  return `${SITE_URL}/${value}`;
}

export async function generateMetadata({ params }: ToolDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return {
      title: "Tool not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${tool.name} for Mac — MacVault`;
  const description = summarizeForMeta(tool.summary || tool.description);
  const canonicalUrl = `${SITE_URL}/tools/${tool.slug}`;
  const primaryImage = toAbsoluteUrl(tool.screenshotUrls[0]);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: primaryImage ? [{ url: primaryImage }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: primaryImage ? [primaryImage] : undefined,
    },
  };
}

export default async function ToolDetailPage({ params }: ToolDetailPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const similarTools = listSimilarTools(tool, 4);
  const ratingCount = tool.upvotes + tool.downvotes;
  const primaryImage = toAbsoluteUrl(tool.screenshotUrls[0]);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.description,
    applicationCategory: "DesktopApplication",
    operatingSystem: "macOS",
    url: tool.websiteUrl || tool.githubUrl,
    image: primaryImage,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: tool.score,
      bestRating: 10,
      ratingCount,
    },
  };

  return (
    <div className="editorial-shell pb-24 pt-10 md:pt-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <ToolHero tool={tool} />

      <section
        className="fade-in-section mt-8 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5"
        style={{ "--fade-delay": "0.05s" } as CSSProperties}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-4 py-3 text-[color:var(--text-muted)]">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em]">
              <Star className="h-4 w-4 text-[color:var(--accent)]" />
              Stars
            </p>
            <p className="mt-1 text-lg font-medium text-[color:var(--text)]">
              {formatCompactNumber(tool.starCount)}
            </p>
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-4 py-3 text-[color:var(--text-muted)]">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em]">
              <GitFork className="h-4 w-4 text-[color:var(--accent)]" />
              Forks
            </p>
            <p className="mt-1 text-lg font-medium text-[color:var(--text)]">
              {formatCompactNumber(tool.forkCount)}
            </p>
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-4 py-3 text-[color:var(--text-muted)]">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em]">
              <CalendarClock className="h-4 w-4 text-[color:var(--accent)]" />
              Last Commit
            </p>
            <p className="mt-1 text-lg font-medium text-[color:var(--text)]">{formatDate(tool.lastCommitDate)}</p>
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-4 py-3 text-[color:var(--text-muted)]">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em]">
              <Scale className="h-4 w-4 text-[color:var(--accent)]" />
              License
            </p>
            <p className="mt-1 inline-flex rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-xs font-medium text-[color:var(--text)]">
              {tool.license || "Unknown"}
            </p>
          </div>
        </div>
      </section>

      <section
        className="fade-in-section mt-10 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]"
        style={{ "--fade-delay": "0.08s" } as CSSProperties}
      >
        <article className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-7">
          <h2 className="text-[30px] font-medium tracking-[-0.02em] text-[color:var(--text)]">
            MacVault Review
          </h2>
          <p className="mt-4 text-[16px] text-[color:var(--text-muted)]">{tool.summary}</p>
          <p className="mt-4 text-[15px] text-[color:var(--text-muted)]">{tool.description}</p>

          <section className="mt-8 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] p-5">
            <h3 className="text-[22px] font-medium tracking-[-0.01em] text-[color:var(--text)]">Screenshots</h3>
            {tool.screenshotUrls.length === 0 ? (
              <p className="mt-3 text-sm text-[color:var(--text-muted)]">Screenshots are being prepared.</p>
            ) : (
              <div className="-mx-1 mt-4 flex snap-x gap-4 overflow-x-auto px-1 pb-2">
                {tool.screenshotUrls.map((imageUrl, index) => (
                  <a
                    key={`${imageUrl}-${index}`}
                    href={imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative block min-w-[270px] snap-start overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[0_10px_25px_rgba(26,26,26,0.07)] transition hover:-translate-y-1"
                  >
                    <img
                      src={imageUrl}
                      alt={`${tool.name} screenshot ${index + 1}`}
                      className="h-[180px] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                    />
                    <span className="absolute bottom-3 right-3 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs font-medium text-[color:var(--text)]">
                      View
                    </span>
                  </a>
                ))}
              </div>
            )}
          </section>

          <section className="mt-8 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] p-5">
            <h3 className="text-[22px] font-medium tracking-[-0.01em] text-[color:var(--text)]">Vote</h3>
            <p className="mt-2 text-sm text-[color:var(--text-muted)]">
              Helpful tools rise faster with community feedback.
            </p>
            <div className="mt-4">
              <VoteButtons
                slug={tool.slug}
                initialUpvotes={tool.upvotes}
                initialDownvotes={tool.downvotes}
                initialVoteCount={tool.voteCount}
              />
            </div>
            <p className="mt-3 inline-flex items-center gap-2 text-xs text-[color:var(--text-muted)]">
              <Vote className="h-3.5 w-3.5" />
              {tool.voteCount} total score ({tool.upvotes} up / {tool.downvotes} down)
            </p>
          </section>

          <section className="mt-8 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-[22px] font-medium tracking-[-0.01em] text-[color:var(--text)]">
                Similar Tools
              </h3>
              <p className="text-xs text-[color:var(--text-muted)]">Same category picks</p>
            </div>
            {similarTools.length === 0 ? (
              <p className="mt-3 text-sm text-[color:var(--text-muted)]">No similar tools available yet.</p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {similarTools.map((item) => (
                  <Link
                    key={item.id}
                    href={`/tools/${item.slug}`}
                    className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 transition hover:bg-[color:var(--bg-soft)]"
                  >
                    <p className="text-sm font-medium text-[color:var(--text)]">{item.name}</p>
                    <p className="mt-1 text-xs text-[color:var(--text-muted)]">{item.categoryName}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </article>

        <aside className="space-y-6">
          <InstallCommand
            brewCommand={tool.brewCommand}
            websiteUrl={tool.websiteUrl}
            installInstructions={tool.installInstructions}
          />

          <ScoreBreakdown tool={tool} />

          <section className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
            <h3 className="text-[24px] font-medium tracking-[-0.01em] text-[color:var(--text)]">Repository</h3>
            <p className="mt-2 text-sm text-[color:var(--text-muted)]">
              Updated {formatRelativeDate(tool.lastCommitDate)}
            </p>
            <div className="mt-4 space-y-2.5">
              <Link
                href={tool.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-4 py-2.5 text-sm text-[color:var(--text)] transition hover:bg-[color:var(--surface)]"
              >
                Open GitHub Repository
              </Link>
              <Link
                href={tool.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-4 py-2.5 text-sm text-[color:var(--text)] transition hover:bg-[color:var(--surface)]"
              >
                Open Project Website
              </Link>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
