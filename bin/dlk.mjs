#!/usr/bin/env node

const DEFAULT_API = process.env.DLK_API || "https://solene-087bb2e2.base44.app";
const VERSION = "0.1.0";

const HELP = `D. L. K News CLI v${VERSION}

Read the live D. L. K newsroom from your terminal.

Usage:
  dlk latest [options]       Show the latest verified headlines
  dlk search <words>          Search the live headline feed
  dlk sources                 Show connected newsroom sources
  dlk about                   Show the command-line tool details
  dlk --help                 Show this help
  dlk --version              Show the version

Options:
  --category <name>           All, Africa, World, Conflict, Crime, Investigations
  --limit <number>            Number of stories, default 10, maximum 36
  --json                      Return machine-readable JSON
  --api <url>                 Use another D. L. K newsFeed endpoint
  --timeout <ms>              Request timeout, default 12000

Examples:
  dlk latest --category Africa --limit 5
  dlk search election Malawi --json
  dlk sources
`;

function parseArgs(argv) {
  const args = [...argv]; const flags = {}; const positionals = [];
  while (args.length) {
    const token = args.shift();
    if (!token.startsWith("-")) { positionals.push(token); continue; }
    if (token === "--json") { flags.json = true; continue; }
    if (token === "--help" || token === "-h") { flags.help = true; continue; }
    if (token === "--version" || token === "-v") { flags.version = true; continue; }
    const [key, inline] = token.split("=", 2); const name = key.slice(2);
    if (inline !== undefined) { flags[name] = inline; continue; }
    const value = args[0] && !args[0].startsWith("-") ? args.shift() : true;
    flags[name] = value;
  }
  return { flags, positionals };
}

function fail(message, code = 1) { console.error(`D.L.K: ${message}`); process.exitCode = code; }
function cleanText(text) { return String(text ?? "").replace(/\s+/g, " ").trim(); }
function shortTime(value) { const date = new Date(value); return Number.isNaN(date.valueOf()) ? "unknown time" : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }); }

export async function fetchFeed({ api = DEFAULT_API, category, timeout = 12000 } = {}) {
  const url = new URL(`${api.replace(/\/$/, "")}/functions/newsFeed`);
  if (category && category.toLowerCase() !== "all") url.searchParams.set("category", category);
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { headers: { accept: "application/json" }, signal: controller.signal });
    if (!response.ok) throw new Error(`newsroom returned HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.stories)) throw new Error("newsroom returned an invalid feed");
    return data;
  } finally { clearTimeout(timer); }
}

function filterStories(stories, query) {
  if (!query) return stories;
  const needle = query.toLowerCase();
  return stories.filter((story) => `${story.title} ${story.summary} ${story.source} ${story.category}`.toLowerCase().includes(needle));
}

function printStories(stories, json) {
  if (json) { console.log(JSON.stringify(stories, null, 2)); return; }
  if (!stories.length) { console.log("No matching stories in the current live feed."); return; }
  for (const [index, story] of stories.entries()) {
    console.log(`\n${index + 1}. ${cleanText(story.title)}`);
    console.log(`   ${story.source} · ${story.category} · ${shortTime(story.publishedAt)}`);
    if (story.summary) console.log(`   ${cleanText(story.summary)}`);
    console.log(`   ${story.url}`);
  }
  console.log(`\n${stories.length} live ${stories.length === 1 ? "story" : "stories"}.`);
}

export async function main(argv = process.argv.slice(2)) {
  const { flags, positionals } = parseArgs(argv);
  if (flags.help || positionals[0] === "help" || !positionals[0]) { console.log(HELP); return; }
  if (flags.version) { console.log(VERSION); return; }
  if (positionals[0] === "about") { console.log("D. L. K News CLI\nA source-first Malawi-first global intelligence desk for the terminal.\nLive feed: BBC World, BBC Africa and Al Jazeera via the D. L. K backend."); return; }
  let data;
  try {
    if (positionals[0] === "sources") {
      data = await fetchFeed({ api: flags.api, timeout: Number(flags.timeout) || 12000 });
      if (flags.json) console.log(JSON.stringify({ sources: data.sources ?? 0, stories: data.stories.length }, null, 2));
      else { console.log(`D. L. K connected sources: ${typeof data.sources === "number" ? data.sources : Object.keys(data.sources ?? {}).length}`); console.log("  BBC World"); console.log("  BBC Africa"); console.log("  Al Jazeera"); }
      return;
    }
    if (positionals[0] !== "latest" && positionals[0] !== "search") return fail(`unknown command '${positionals[0]}'. Run 'dlk --help'.`);
    data = await fetchFeed({ api: flags.api, category: flags.category, timeout: Number(flags.timeout) || 12000 });
    let stories = data.stories;
    if (positionals[0] === "search") stories = filterStories(stories, positionals.slice(1).join(" "));
    const limit = Math.min(Math.max(Number(flags.limit) || 10, 1), 36);
    printStories(stories.slice(0, limit), Boolean(flags.json));
  } catch (error) { fail(error.name === "AbortError" ? "the newsroom request timed out" : error.message); }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
