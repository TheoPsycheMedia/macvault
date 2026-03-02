import { getClient, ensureInitialized } from "../src/lib/db-core";

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

interface ManualTool {
  name: string;
  slug?: string;
  description: string;
  summary: string;
  githubUrl: string;
  websiteUrl: string;
  category: string;
  subcategory: string;
  brewCommand: string;
  installInstructions: string;
  score: number;
  starCount: number;
  license: string;
}

const tools: ManualTool[] = [
  {
    name: "Raycast",
    description: "Raycast is a blazingly fast, totally extendable launcher for macOS. Search apps, run scripts, use AI, control your system — all from one keyboard shortcut.",
    summary: "Raycast is a blazingly fast, totally extendable launcher for macOS. It replaces Spotlight with a powerful command palette that supports AI, extensions, clipboard history, window management, and thousands of community integrations.",
    githubUrl: "https://github.com/raycast/extensions",
    websiteUrl: "https://raycast.com",
    category: "productivity", subcategory: "Launchers",
    brewCommand: "brew install --cask raycast",
    installInstructions: "Install via Homebrew: `brew install --cask raycast` or download from raycast.com",
    score: 9.4, starCount: 35000, license: "MIT (extensions)"
  },
  {
    name: "Alfred",
    description: "Alfred is an award-winning productivity app for macOS. Boost your efficiency with hotkeys, keywords, text expansion, workflows, and custom automation.",
    summary: "Alfred is the classic macOS productivity launcher. It boosts efficiency with hotkeys, keywords, file search, custom workflows (Powerpack), clipboard history, snippets, and deep macOS integration. A staple for power users since 2011.",
    githubUrl: "https://github.com/zenorocha/alfred-workflows",
    websiteUrl: "https://alfredapp.com",
    category: "productivity", subcategory: "Launchers",
    brewCommand: "brew install --cask alfred",
    installInstructions: "Install via Homebrew: `brew install --cask alfred` or download from alfredapp.com. The Powerpack upgrade unlocks workflows and advanced features.",
    score: 9.0, starCount: 15000, license: "Proprietary (free tier + paid Powerpack)"
  },
  {
    name: "Karabiner-Elements",
    description: "Karabiner-Elements is a powerful keyboard customizer for macOS. Remap keys, create complex modifications, and build custom keyboard layouts.",
    summary: "Karabiner-Elements is the definitive keyboard customizer for macOS. Remap any key, create complex rules triggered by key combinations, fix keyboard issues (like Caps Lock lag), and support third-party keyboards with macOS-unfriendly layouts. Completely free and open source.",
    githubUrl: "https://github.com/pqrs-org/Karabiner-Elements",
    websiteUrl: "https://karabiner-elements.pqrs.org",
    category: "system-utilities", subcategory: "Keyboard Tools",
    brewCommand: "brew install --cask karabiner-elements",
    installInstructions: "Install via Homebrew: `brew install --cask karabiner-elements` or download from karabiner-elements.pqrs.org",
    score: 9.1, starCount: 20000, license: "MIT"
  },
  {
    name: "Bartender",
    description: "Bartender is the ultimate menu bar management app for macOS. Organize, hide, and quickly access your menu bar icons.",
    summary: "Bartender is the premium menu bar manager for macOS. Hide, rearrange, and quickly access any menu bar icon. Features include menu bar item search, keyboard shortcuts for hidden items, and automatic showing when items update. The go-to tool for keeping a tidy menu bar — a great paid alternative to the free Ice.",
    githubUrl: "",
    websiteUrl: "https://www.macbartender.com",
    category: "menu-bar", subcategory: "Menu Bar Management",
    brewCommand: "brew install --cask bartender",
    installInstructions: "Install via Homebrew: `brew install --cask bartender` or download from macbartender.com. Requires a one-time purchase.",
    score: 8.8, starCount: 0, license: "Proprietary (paid)"
  },
];

async function main() {
  await ensureInitialized();
  const db = getClient();
  const now = new Date().toISOString();
  let added = 0;

  for (const tool of tools) {
    // Check if already exists
    const exists = await db.execute("SELECT id FROM tools WHERE name = ? LIMIT 1", [tool.name]);
    if (exists.rows.length > 0) {
      console.log(`[skip] ${tool.name} already exists`);
      continue;
    }

    const slug = tool.slug || await findUniqueSlug(db, tool.name);
    
    await db.execute(
      `INSERT INTO tools (name,slug,description,summary,githubUrl,websiteUrl,category,subcategory,iconUrl,screenshotUrls,brewCommand,installInstructions,score,starCount,forkCount,lastCommitDate,license,createdAt,updatedAt,isPublished,isFeatured) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,0)`,
      [tool.name, slug, tool.description, tool.summary, tool.githubUrl, tool.websiteUrl, tool.category, tool.subcategory, '', '[]', tool.brewCommand, tool.installInstructions, tool.score, tool.starCount, 0, now, tool.license, now, now]
    );
    
    console.log(`[added] ${tool.name} (slug:${slug})`);
    added++;
  }

  const total = await db.execute("SELECT COUNT(*) as cnt FROM tools WHERE isPublished = 1");
  const totalCount = Number((total.rows[0] as Record<string, unknown>).cnt);
  console.log(`\nAdded: ${added} | Total published: ${totalCount}`);
}

main().catch(console.error);
