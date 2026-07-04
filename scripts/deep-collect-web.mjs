import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const dataDir = path.join(projectRoot, "data");
const deepDir = path.join(dataDir, "deep-raw");
const startedAt = new Date();
const args = parseArgs(process.argv.slice(2));
const durationMinutes = Number(args.minutes ?? 20);
const maxDepth = Number(args.depth ?? 1);
const delayMs = Number(args.delayMs ?? 1500);
const maxPagesPerHost = Number(args.maxPagesPerHost ?? 45);
const minDurationMs = Math.max(0.01, durationMinutes) * 60 * 1000;

await mkdir(deepDir, { recursive: true });

const sources = await loadSeedSources();
const queue = sources.map((source) => ({
  url: source.url,
  depth: 0,
  seed_id: source.id,
  seed_name: source.name,
  seed_category: source.category,
}));
const visited = new Set();
const hostCounts = new Map();
const pages = [];
const links = [];
const downloads = [];
const errors = [];
const rounds = [];

while (Date.now() - startedAt.getTime() < minDurationMs) {
  const roundStartedAt = new Date();
  let processed = 0;

  while (queue.length > 0 && Date.now() - startedAt.getTime() < minDurationMs) {
    const task = queue.shift();
    if (!task || visited.has(task.url)) {
      continue;
    }

    const host = safeHost(task.url);
    if (!host) {
      continue;
    }

    const hostCount = hostCounts.get(host) ?? 0;
    if (hostCount >= maxPagesPerHost) {
      continue;
    }
    hostCounts.set(host, hostCount + 1);
    visited.add(task.url);

    const result = await collectPage(task);
    processed += 1;

    if (result.ok && task.depth < maxDepth) {
      for (const link of result.links) {
        if (shouldFollow(link.url, task.url) && !visited.has(link.url)) {
          queue.push({
            url: link.url,
            depth: task.depth + 1,
            seed_id: task.seed_id,
            seed_name: task.seed_name,
            seed_category: task.seed_category,
          });
        }
      }
    }

    await sleep(delayMs);
  }

  rounds.push({
    started_at: roundStartedAt.toISOString(),
    ended_at: new Date().toISOString(),
    processed,
    queue_length: queue.length,
    visited_count: visited.size,
  });

  if (queue.length === 0 && Date.now() - startedAt.getTime() < minDurationMs) {
    for (const source of sources) {
      queue.push({
        url: withCacheBust(source.url),
        depth: 0,
        seed_id: source.id,
        seed_name: source.name,
        seed_category: source.category,
      });
    }
    await sleep(Math.max(delayMs, 5000));
  }
}

const endedAt = new Date();
const report = {
  started_at: startedAt.toISOString(),
  ended_at: endedAt.toISOString(),
  duration_ms: endedAt.getTime() - startedAt.getTime(),
  requested_minutes: durationMinutes,
  max_depth: maxDepth,
  delay_ms: delayMs,
  seed_count: sources.length,
  page_count: pages.length,
  link_count: links.length,
  downloadable_link_count: downloads.length,
  error_count: errors.length,
  host_counts: Object.fromEntries(hostCounts.entries()),
  rounds,
  pages,
  downloads,
  errors,
};

await writeJson(path.join(dataDir, "deep-collection-report.json"), report);
await writeJson(path.join(dataDir, "deep-links.json"), {
  collected_at: endedAt.toISOString(),
  links,
});
console.log(
  `Deep collection complete: ${pages.length} pages, ${links.length} links, ${downloads.length} downloadable links, ${errors.length} errors, ${Math.round(report.duration_ms / 1000)}s.`,
);

async function collectPage(task) {
  const pageStartedAt = new Date();
  let status = 0;
  let text = "";
  let contentType = "";
  let errorMessage = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const response = await fetch(task.url, {
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; DalseoAIImpactDeepCollector/0.1; research inventory)",
      },
    });
    clearTimeout(timeout);
    status = response.status;
    contentType = response.headers.get("content-type") ?? "";
    text = await response.text();
  } catch (error) {
    errorMessage = formatError(error);
    errors.push({
      url: task.url,
      seed_id: task.seed_id,
      error: errorMessage,
      collected_at: new Date().toISOString(),
    });
  }

  const normalizedText = normalizeText(stripHtml(text));
  const title = extractTitle(text) ?? task.seed_name;
  const pageLinks = extractLinks(task.url, text);
  const fileBase = `${slug(task.seed_id)}-${slug(new URL(task.url).hostname)}-${hash(task.url)}.html`;
  const rawPath = path.join(deepDir, fileBase);
  await writeFile(rawPath, text, "utf8");

  const page = {
    url: task.url,
    seed_id: task.seed_id,
    seed_name: task.seed_name,
    category: task.seed_category,
    depth: task.depth,
    status,
    content_type: contentType,
    title,
    text_preview: normalizedText.slice(0, 500),
    raw_file: `data/deep-raw/${fileBase}`,
    link_count: pageLinks.length,
    downloadable_link_count: pageLinks.filter((link) => link.is_download).length,
    error_message: errorMessage,
    collected_at: pageStartedAt.toISOString(),
  };
  pages.push(page);

  for (const link of pageLinks) {
    const record = {
      ...link,
      source_url: task.url,
      seed_id: task.seed_id,
      seed_name: task.seed_name,
      category: task.seed_category,
      collected_at: pageStartedAt.toISOString(),
    };
    links.push(record);
    if (record.is_download) {
      downloads.push(record);
    }
  }

  return {
    ok: status >= 200 && status < 400 && !errorMessage,
    links: pageLinks,
  };
}

async function loadSeedSources() {
  const catalogPath = path.join(dataDir, "source-catalog.json");
  const sourcesPath = path.join(dataDir, "sources.json");

  try {
    const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
    return dedupeByUrl(catalog.sources ?? []);
  } catch {
    const sourceData = JSON.parse(await readFile(sourcesPath, "utf8"));
    return dedupeByUrl(sourceData.sources ?? []);
  }
}

function extractLinks(baseUrl, html) {
  const records = [];
  const seen = new Set();
  const hrefPattern = /\b(?:href|src)=["']([^"']+)["']/gi;
  let match;

  while ((match = hrefPattern.exec(html)) !== null) {
    const url = resolveUrl(baseUrl, decodeEntities(match[1]));
    if (!url || seen.has(url)) {
      continue;
    }
    seen.add(url);
    records.push({
      url,
      host: safeHost(url),
      text: "",
      extension: extensionOf(url),
      is_download: isDownloadUrl(url),
    });
  }

  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis;
  while ((match = anchorPattern.exec(html)) !== null) {
    const url = resolveUrl(baseUrl, decodeEntities(match[1]));
    if (!url) {
      continue;
    }

    const existing = records.find((record) => record.url === url);
    if (existing) {
      existing.text = normalizeText(stripHtml(match[2])).slice(0, 160);
    }
  }

  return records;
}

function shouldFollow(nextUrl, fromUrl) {
  const nextHost = safeHost(nextUrl);
  const fromHost = safeHost(fromUrl);
  if (!nextHost || !fromHost) {
    return false;
  }

  const allowedHosts = [
    "dalseo.daegu.kr",
    "www.dalseo.daegu.kr",
    "tv.dalseocouncil.daegu.kr",
    "car.daegu.go.kr",
    "pis.daegu.go.kr",
    "www.daegu.go.kr",
    "data.daegu.go.kr",
    "sido.daegu.go.kr",
    "data.go.kr",
    "www.data.go.kr",
  ];

  if (!allowedHosts.some((host) => nextHost === host || nextHost.endsWith(`.${host}`))) {
    return false;
  }

  if (isDownloadUrl(nextUrl)) {
    return false;
  }

  if (nextUrl.includes("javascript:") || nextUrl.includes("mailto:")) {
    return false;
  }

  return nextHost === fromHost || nextHost.endsWith("data.go.kr") || fromHost.endsWith("data.go.kr");
}

function isDownloadUrl(url) {
  const ext = extensionOf(url);
  return ["pdf", "hwp", "hwpx", "xls", "xlsx", "csv", "zip", "doc", "docx", "json", "xml"].includes(ext);
}

function extensionOf(url) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    const match = pathname.match(/\.([a-z0-9]+)$/);
    return match?.[1] ?? "";
  } catch {
    return "";
  }
}

function resolveUrl(baseUrl, href) {
  if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) {
    return null;
  }

  try {
    const url = new URL(href, baseUrl);
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function withCacheBust(url) {
  const parsed = new URL(url);
  parsed.searchParams.set("_deep_collected_at", String(Date.now()));
  return parsed.toString();
}

function dedupeByUrl(sources) {
  return [...new Map(sources.filter((source) => source.url).map((source) => [source.url, source])).values()];
}

function parseArgs(values) {
  const parsed = {};
  for (const value of values) {
    const match = value.match(/^--([^=]+)=(.*)$/);
    if (match) {
      parsed[match[1]] = match[2];
    }
  }
  return parsed;
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function extractTitle(html) {
  const ogTitle = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
  );

  if (ogTitle?.[1]) {
    return decodeEntities(ogTitle[1]).trim();
  }

  const title = html.match(/<title[^>]*>(.*?)<\/title>/is);
  return title?.[1] ? decodeEntities(stripHtml(title[1])).trim() : null;
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function normalizeText(text) {
  return decodeEntities(text).replace(/\s+/g, " ").trim();
}

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function safeHost(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function hash(value) {
  let output = 0;
  for (let index = 0; index < value.length; index += 1) {
    output = (output * 31 + value.charCodeAt(index)) >>> 0;
  }
  return output.toString(16);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function formatError(error) {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const cause = error.cause instanceof Error ? ` (${error.cause.message})` : "";
  return `${error.message}${cause}`;
}
