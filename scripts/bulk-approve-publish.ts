import { getClient, ensureInitialized } from "../src/lib/db-core";

interface ToolApproval {
  id: number;
  summary: string;
  category: string;
  subcategory: string;
  brewCommand: string;
  installInstructions: string;
  scores: {
    design: number; performance: number; documentation: number; maintenance: number;
    integration: number; uniqueness: number; value: number; community: number;
  };
}

const approvals: ToolApproval[] = [
  {
    id: 19, // zed
    summary: "Zed is a high-performance, multiplayer code editor written in Rust. Built by the creators of Atom and Tree-sitter, it offers GPU-accelerated rendering, native macOS performance, and real-time collaboration built in.",
    category: "developer-tools", subcategory: "Code Editors",
    brewCommand: "brew install --cask zed",
    installInstructions: "Install via Homebrew: `brew install --cask zed` or download from zed.dev",
    scores: { design: 9, performance: 10, documentation: 8, maintenance: 10, integration: 8, uniqueness: 9, value: 9, community: 9 }
  },
  {
    id: 328, // yabai
    summary: "Yabai is a tiling window manager for macOS based on binary space partitioning. It enables automatic window tiling, powerful scripting, and keyboard-driven workflows on macOS.",
    category: "system-utilities", subcategory: "Window Management",
    brewCommand: "brew install koekeishiya/formulae/yabai",
    installInstructions: "Install via Homebrew: `brew install koekeishiya/formulae/yabai`. Requires SIP to be partially disabled for full functionality.",
    scores: { design: 7, performance: 9, documentation: 8, maintenance: 8, integration: 9, uniqueness: 8, value: 9, community: 8 }
  },
  {
    id: 31, // logseq
    summary: "Logseq is a privacy-first, open-source knowledge management platform. It uses an outliner-based approach with bidirectional linking, letting you build a personal knowledge graph from plain text Markdown and Org-mode files.",
    category: "productivity", subcategory: "Note-Taking",
    brewCommand: "brew install --cask logseq",
    installInstructions: "Install via Homebrew: `brew install --cask logseq` or download from logseq.com",
    scores: { design: 8, performance: 7, documentation: 8, maintenance: 8, integration: 8, uniqueness: 8, value: 9, community: 9 }
  },
  {
    id: 158, // cherry-studio
    summary: "Cherry Studio is an AI productivity desktop app giving you unified access to 300+ LLM assistants including GPT-4, Claude, and Gemini. Features smart chat, autonomous agents, and a clean macOS-native UI.",
    category: "productivity", subcategory: "AI Tools",
    brewCommand: "brew install --cask cherry-studio",
    installInstructions: "Install via Homebrew: `brew install --cask cherry-studio` or download from cherry-ai.com",
    scores: { design: 9, performance: 8, documentation: 7, maintenance: 9, integration: 9, uniqueness: 8, value: 9, community: 8 }
  },
  {
    id: 196, // lossless-cut
    summary: "LosslessCut is the swiss army knife of lossless video and audio editing. Trim, cut, and merge video files without re-encoding — preserving full quality at blazing speed. Supports virtually every format via FFmpeg.",
    category: "creative", subcategory: "Video Editing",
    brewCommand: "brew install --cask losslesscut",
    installInstructions: "Install via Homebrew: `brew install --cask losslesscut` or download from GitHub releases.",
    scores: { design: 8, performance: 9, documentation: 8, maintenance: 9, integration: 8, uniqueness: 9, value: 10, community: 8 }
  },
  {
    id: 11, // lapce
    summary: "Lapce is an ultra-fast, open-source code editor written in Rust using its own GPU-accelerated UI framework. It offers modal editing, built-in LSP support, remote development, and a plugin system.",
    category: "developer-tools", subcategory: "Code Editors",
    brewCommand: "brew install --cask lapce",
    installInstructions: "Install via Homebrew: `brew install --cask lapce` or download from lapce.dev",
    scores: { design: 8, performance: 10, documentation: 7, maintenance: 8, integration: 8, uniqueness: 9, value: 8, community: 8 }
  },
  {
    id: 79, // insomnia
    summary: "Insomnia is a powerful open-source API client for REST, GraphQL, WebSockets, and gRPC. It features a clean UI, environment variables, authentication helpers, and a plugin ecosystem — a popular Postman alternative.",
    category: "developer-tools", subcategory: "API Tools",
    brewCommand: "brew install --cask insomnia",
    installInstructions: "Install via Homebrew: `brew install --cask insomnia` or download from insomnia.rest",
    scores: { design: 9, performance: 8, documentation: 9, maintenance: 8, integration: 9, uniqueness: 7, value: 9, community: 9 }
  },
  {
    id: 218, // qBittorrent
    summary: "qBittorrent is a free, open-source BitTorrent client with a polished Qt interface. It features an integrated torrent search engine, sequential downloading, IP filtering, and no bundled adware.",
    category: "system-utilities", subcategory: "File Management",
    brewCommand: "brew install --cask qbittorrent",
    installInstructions: "Install via Homebrew: `brew install --cask qbittorrent` or download from qbittorrent.org",
    scores: { design: 8, performance: 9, documentation: 7, maintenance: 9, integration: 7, uniqueness: 6, value: 9, community: 9 }
  },
  {
    id: 202, // mpv
    summary: "mpv is a free, open-source, cross-platform media player. It supports a vast number of video formats, codecs, and container formats. Known for its scriptability, high-quality video output, and minimal UI.",
    category: "creative", subcategory: "Media Players",
    brewCommand: "brew install --cask mpv",
    installInstructions: "Install via Homebrew: `brew install --cask mpv`",
    scores: { design: 7, performance: 10, documentation: 7, maintenance: 9, integration: 9, uniqueness: 7, value: 9, community: 8 }
  },
  {
    id: 330, // keepassxc
    summary: "KeePassXC is a cross-platform, community-driven port of the Windows KeePass password manager. It stores your passwords in an encrypted database, supports hardware security keys, and has no cloud dependency.",
    category: "security", subcategory: "Password Managers",
    brewCommand: "brew install --cask keepassxc",
    installInstructions: "Install via Homebrew: `brew install --cask keepassxc` or download from keepassxc.org",
    scores: { design: 8, performance: 9, documentation: 9, maintenance: 9, integration: 8, uniqueness: 7, value: 10, community: 9 }
  },
  {
    id: 190, // HandBrake
    summary: "HandBrake is the go-to open-source video transcoder. Convert almost any video format to modern codecs like H.265, AV1, and VP9. Batch encoding, hardware acceleration, and presets make it indispensable.",
    category: "creative", subcategory: "Video Editing",
    brewCommand: "brew install --cask handbrake",
    installInstructions: "Install via Homebrew: `brew install --cask handbrake` or download from handbrake.fr",
    scores: { design: 8, performance: 9, documentation: 9, maintenance: 9, integration: 8, uniqueness: 7, value: 10, community: 9 }
  },
  {
    id: 109, // beekeeper-studio
    summary: "Beekeeper Studio is a modern, cross-platform SQL editor and database manager. It supports MySQL, PostgreSQL, SQLite, SQL Server, and more. Features tabbed connections, a query editor, and a clean dark-mode UI.",
    category: "developer-tools", subcategory: "Database Tools",
    brewCommand: "brew install --cask beekeeper-studio",
    installInstructions: "Install via Homebrew: `brew install --cask beekeeper-studio` or download from beekeeperstudio.io",
    scores: { design: 9, performance: 8, documentation: 8, maintenance: 9, integration: 8, uniqueness: 7, value: 9, community: 8 }
  },
  {
    id: 144, // Kap
    summary: "Kap is a beautifully simple, open-source screen recorder built for macOS. Record your screen as GIF, MP4, WebM, or APNG. Plugins extend functionality for direct sharing to services like Imgur and Streamable.",
    category: "creative", subcategory: "Screen Recording",
    brewCommand: "brew install --cask kap",
    installInstructions: "Install via Homebrew: `brew install --cask kap` or download from getkap.co",
    scores: { design: 10, performance: 8, documentation: 8, maintenance: 7, integration: 8, uniqueness: 8, value: 9, community: 8 }
  },
  {
    id: 341, // BackgroundMusic
    summary: "Background Music is a macOS audio utility that automatically pauses your music when other audio plays, lets you set per-app volume levels, and records system audio — all without any external hardware.",
    category: "system-utilities", subcategory: "Audio Tools",
    brewCommand: "brew install --cask background-music",
    installInstructions: "Install via Homebrew: `brew install --cask background-music` or build from source on GitHub.",
    scores: { design: 7, performance: 8, documentation: 7, maintenance: 7, integration: 9, uniqueness: 9, value: 9, community: 8 }
  },
  {
    id: 184, // BlackHole
    summary: "BlackHole is a modern macOS virtual audio loopback driver. Route audio between applications with zero additional latency. Essential for podcasters, musicians, and streamers who need to capture system audio.",
    category: "system-utilities", subcategory: "Audio Tools",
    brewCommand: "brew install --cask blackhole-2ch",
    installInstructions: "Install via Homebrew: `brew install --cask blackhole-2ch` (2-channel) or `blackhole-16ch` / `blackhole-64ch` for more channels.",
    scores: { design: 6, performance: 10, documentation: 8, maintenance: 8, integration: 10, uniqueness: 9, value: 10, community: 8 }
  },
  {
    id: 319, // Amethyst
    summary: "Amethyst is an automatic tiling window manager for macOS inspired by xmonad. It organizes windows into predefined layouts automatically, supports multiple layouts, and is fully keyboard-driven.",
    category: "system-utilities", subcategory: "Window Management",
    brewCommand: "brew install --cask amethyst",
    installInstructions: "Install via Homebrew: `brew install --cask amethyst` or download from ianyh.com/amethyst",
    scores: { design: 8, performance: 9, documentation: 8, maintenance: 8, integration: 8, uniqueness: 8, value: 9, community: 8 }
  },
  {
    id: 306, // hammerspoon
    summary: "Hammerspoon is a staggeringly powerful macOS desktop automation tool. It bridges Lua scripting directly to macOS APIs, letting you automate anything: window management, hotkeys, alerts, file system events, and more.",
    category: "system-utilities", subcategory: "Automation",
    brewCommand: "brew install --cask hammerspoon",
    installInstructions: "Install via Homebrew: `brew install --cask hammerspoon` or download from hammerspoon.org",
    scores: { design: 7, performance: 9, documentation: 9, maintenance: 8, integration: 10, uniqueness: 9, value: 10, community: 9 }
  },
  {
    id: 126, // iTerm2
    summary: "iTerm2 is the de facto terminal emulator for macOS, packed with features the default Terminal.app doesn't have: split panes, search, autocomplete, a hotkey window, tmux integration, and extensive customization.",
    category: "developer-tools", subcategory: "Terminal Emulators",
    brewCommand: "brew install --cask iterm2",
    installInstructions: "Install via Homebrew: `brew install --cask iterm2` or download from iterm2.com",
    scores: { design: 9, performance: 8, documentation: 10, maintenance: 9, integration: 9, uniqueness: 8, value: 10, community: 10 }
  },
  {
    id: 356, // OpenEmu
    summary: "OpenEmu is the gold standard of retro game emulation on macOS. It supports 30+ game systems through a plugin architecture, with a beautiful cover-art library interface, controller mapping, and save states.",
    category: "creative", subcategory: "Gaming",
    brewCommand: "brew install --cask openemu",
    installInstructions: "Install via Homebrew: `brew install --cask openemu` or download from openemu.org",
    scores: { design: 10, performance: 9, documentation: 8, maintenance: 7, integration: 8, uniqueness: 9, value: 9, community: 9 }
  },
  {
    id: 111, // sqlitebrowser / DB Browser for SQLite
    summary: "DB Browser for SQLite is a high-quality, open-source GUI for creating, designing, and editing SQLite database files. A must-have tool for developers who work with SQLite — no command line required.",
    category: "developer-tools", subcategory: "Database Tools",
    brewCommand: "brew install --cask db-browser-for-sqlite",
    installInstructions: "Install via Homebrew: `brew install --cask db-browser-for-sqlite` or download from sqlitebrowser.org",
    scores: { design: 8, performance: 8, documentation: 8, maintenance: 7, integration: 7, uniqueness: 7, value: 9, community: 8 }
  },
];

function average(values: number[]) {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function roundScore(v: number) {
  return Number(v.toFixed(1));
}

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "mac-tool";
}

async function findUniqueSlug(db: ReturnType<typeof getClient>, name: string) {
  const base = slugify(name);
  let slug = base; let suffix = 2;
  while (true) {
    const exists = await db.execute("SELECT id FROM tools WHERE slug = ? LIMIT 1", [slug]);
    if (exists.rows.length === 0) return slug;
    slug = `${base}-${suffix++}`;
  }
}

async function main() {
  await ensureInitialized();
  const db = getClient();
  
  let approved = 0, published = 0, skipped = 0;

  for (const tool of approvals) {
    // Check if already processed
    const existing = await db.execute("SELECT id, status FROM discovery_queue WHERE id = ? LIMIT 1", [tool.id]);
    const row = existing.rows[0] as Record<string, unknown> | undefined;
    if (!row) { console.log(`[skip] id ${tool.id} not found`); skipped++; continue; }
    if (row.status === 'published') { console.log(`[skip] id ${tool.id} already published`); skipped++; continue; }

    const now = new Date().toISOString();
    const scores = tool.scores;
    const overallScore = roundScore(average(Object.values(scores)));

    // Step 1: Mark as approved
    await db.execute(
      `UPDATE discovery_queue SET status='approved', aiSummary=?, aiScores=?, aiCategory=?, aiSubcategory=?, aiBrewCommand=?, aiInstallInstructions=?, evaluatedAt=?, updatedAt=? WHERE id=?`,
      [tool.summary, JSON.stringify(scores), tool.category, tool.subcategory, tool.brewCommand, tool.installInstructions, now, now, tool.id]
    );
    approved++;

    // Step 2: Fetch candidate data
    const cand = await db.execute("SELECT * FROM discovery_queue WHERE id = ? LIMIT 1", [tool.id]);
    const c = cand.rows[0] as Record<string, unknown>;

    // Step 3: Insert into tools
    const slug = await findUniqueSlug(db, String(c.name || ''));
    const name = String(c.name || '');
    const description = String(c.description || tool.summary);
    const githubUrl = String(c.githubUrl || '');
    const starCount = Number(c.starCount || 0);
    const forkCount = Number(c.forkCount || 0);
    const lastCommitDate = String(c.lastCommitDate || now);
    const license = String(c.license || 'Unknown');

    const funcScore = roundScore(average([scores.performance, scores.integration, scores.uniqueness]));
    const usefulness = roundScore(scores.value);
    const visualQuality = roundScore(scores.design);
    const installEase = roundScore(average([scores.integration, scores.documentation]));
    const maintenanceHealth = roundScore(scores.maintenance);
    const docQuality = roundScore(scores.documentation);
    const appleSilicon = roundScore(average([scores.performance, scores.integration]));
    const privacy = roundScore(average([scores.community, scores.maintenance]));

    const scoreJson = JSON.stringify({
      functionality: funcScore, usefulness, visualQuality, installEase,
      maintenanceHealth, documentationQuality: docQuality, appleSiliconSupport: appleSilicon,
      privacySecurity: privacy, overallScore
    });

    try {
      await db.execute(
        `INSERT INTO tools (name,slug,description,summary,githubUrl,websiteUrl,category,subcategory,iconUrl,screenshotUrls,brewCommand,installInstructions,score,starCount,forkCount,lastCommitDate,license,createdAt,updatedAt,isPublished,isFeatured) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,0)`,
        [name, slug, description, tool.summary, githubUrl, githubUrl, tool.category, tool.subcategory, '', '[]', tool.brewCommand, tool.installInstructions, overallScore, starCount, forkCount, lastCommitDate, license, now, now]
      );
      
      // Mark queue item as published
      await db.execute("UPDATE discovery_queue SET status='published', updatedAt=? WHERE id=?", [now, tool.id]);
      published++;
      console.log(`[published] ${name} (id:${tool.id}, slug:${slug}, score:${overallScore})`);
    } catch (e) {
      console.error(`[error] ${name}: ${e}`);
    }
  }

  // Final count
  const total = await db.execute("SELECT COUNT(*) as cnt FROM tools WHERE isPublished = 1");
  const totalCount = Number((total.rows[0] as Record<string, unknown>).cnt);
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Approved: ${approved}`);
  console.log(`Published: ${published}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total published tools: ${totalCount}`);
}

main().catch(console.error);
