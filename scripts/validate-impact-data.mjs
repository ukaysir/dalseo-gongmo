import { readFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const dataDir = path.join(projectRoot, "data");
const impactDataPath = path.join(dataDir, "impact-items.json");
const sourcesPath = path.join(dataDir, "sources.json");

const validCategories = new Set([
  "traffic",
  "construction",
  "urban_plan",
  "council",
  "public_notice",
  "event",
  "safety",
  "parking",
  "heat",
  "facility",
  "welfare",
  "environment",
]);

const impactData = JSON.parse(await readFile(impactDataPath, "utf8"));
const sourcesData = JSON.parse(await readFile(sourcesPath, "utf8"));
const items = Array.isArray(impactData) ? impactData : impactData.items ?? [];
const sources = sourcesData.sources ?? [];
const sourceIds = new Set(sources.map((source) => source.id));
const sourceById = new Map(sources.map((source) => [source.id, source]));
const errors = [];
const warnings = [];
const seenIds = new Set();

for (const item of items) {
  validateRequiredFields(item);
  validateStableId(item);
  validateCategory(item);
  validateSource(item);
  validateCoordinates(item);
  validateDates(item);
  validateImpacts(item);
  validateUrl(item);
}

for (const source of sources) {
  validateSourceRecord(source);
}

const report = {
  item_count: items.length,
  source_count: sources.length,
  error_count: errors.length,
  warning_count: warnings.length,
  category_counts: countBy(items, "category"),
  source_status_counts: countBy(sources, "source_status"),
  errors,
  warnings,
};

console.log(JSON.stringify(report, null, 2));

if (errors.length > 0) {
  process.exitCode = 1;
}

function validateRequiredFields(item) {
  for (const field of [
    "id",
    "title",
    "category",
    "source_name",
    "source_url",
    "address",
    "dong",
    "lat",
    "lng",
    "summary",
    "plain_summary",
    "action_guide",
    "department",
    "contact",
    "updated_at",
  ]) {
    if (item[field] === undefined || item[field] === null || item[field] === "") {
      errors.push(`${item.id ?? "unknown"}: missing ${field}`);
    }
  }
}

function validateStableId(item) {
  if (seenIds.has(item.id)) {
    errors.push(`${item.id}: duplicate id`);
  }
  seenIds.add(item.id);

  if (!/^[a-z0-9][a-z0-9-]+$/.test(item.id)) {
    errors.push(`${item.id}: id must be lowercase kebab-case`);
  }
}

function validateCategory(item) {
  if (!validCategories.has(item.category)) {
    errors.push(`${item.id}: invalid category ${item.category}`);
  }
}

function validateSource(item) {
  if (!item.source_id) {
    warnings.push(`${item.id}: source_id is missing`);
    return;
  }

  if (!sourceIds.has(item.source_id)) {
    errors.push(`${item.id}: source_id ${item.source_id} does not exist in data/sources.json`);
    return;
  }

  const source = sourceById.get(item.source_id);
  if (source.status >= 400 || source.source_status === "fetch_error") {
    warnings.push(`${item.id}: source ${item.source_id} was not cleanly collected (${source.source_status})`);
  }
}

function validateCoordinates(item) {
  if (!Number.isFinite(item.lat) || !Number.isFinite(item.lng)) {
    errors.push(`${item.id}: invalid coordinates`);
    return;
  }

  if (item.lat < 35.75 || item.lat > 35.9 || item.lng < 128.45 || item.lng > 128.6) {
    warnings.push(`${item.id}: coordinates outside expected Dalseo/nearby bounds`);
  }
}

function validateDates(item) {
  for (const field of ["starts_at", "ends_at", "opinion_due_at", "updated_at", "collected_at"]) {
    if (item[field] && !isIsoLikeDate(item[field])) {
      errors.push(`${item.id}: invalid ${field} date ${item[field]}`);
    }
  }

  if (item.starts_at && item.ends_at && item.starts_at > item.ends_at) {
    errors.push(`${item.id}: starts_at is after ends_at`);
  }
}

function validateImpacts(item) {
  if (!Array.isArray(item.impacts) || item.impacts.length === 0) {
    errors.push(`${item.id}: impacts must be non-empty`);
    return;
  }

  const normalized = item.impacts.map((impact) => String(impact).trim()).filter(Boolean);
  if (normalized.length !== item.impacts.length) {
    errors.push(`${item.id}: impacts contain empty values`);
  }

  if (new Set(normalized).size !== normalized.length) {
    warnings.push(`${item.id}: duplicate impacts`);
  }
}

function validateUrl(item) {
  if (!String(item.source_url).startsWith("http://") && !String(item.source_url).startsWith("https://")) {
    errors.push(`${item.id}: source_url must be absolute`);
  }
}

function validateSourceRecord(source) {
  for (const field of ["id", "name", "url", "kind", "category", "source_status", "collected_at"]) {
    if (source[field] === undefined || source[field] === null || source[field] === "") {
      errors.push(`source ${source.id ?? "unknown"}: missing ${field}`);
    }
  }

  if (source.status >= 400) {
    warnings.push(`source ${source.id}: HTTP status ${source.status}`);
  }

  if (!source.text_preview || source.text_preview.includes("400 Bad Request") || source.text_preview.includes("수집 실패")) {
    warnings.push(`source ${source.id}: weak or failed text preview`);
  }
}

function isIsoLikeDate(value) {
  return /^\d{4}-\d{2}-\d{2}/.test(String(value));
}

function countBy(rows, key) {
  return rows.reduce((counts, row) => {
    const value = row[key] ?? "unknown";
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}
