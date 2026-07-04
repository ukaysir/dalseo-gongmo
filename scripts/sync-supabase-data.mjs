import { createClient } from "@supabase/supabase-js";
import { readFile } from "fs/promises";
import path from "path";

await loadEnvFile(path.join(process.cwd(), ".env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in your shell or .env.local before syncing.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const dataDir = path.join(process.cwd(), "data");

const impactItemsFile = await readJson(path.join(dataDir, "impact-items.json"));
const sourcesFile = await readJson(path.join(dataDir, "sources.json"));
const collectionReport = await readJson(path.join(dataDir, "collection-report.json"));

const impactItems = Array.isArray(impactItemsFile)
  ? impactItemsFile
  : (impactItemsFile.items ?? []);
const sources = Array.isArray(sourcesFile) ? sourcesFile : (sourcesFile.sources ?? []);

try {
  await upsertRows("impact_items", impactItems.map(toImpactRow), "external_id");

  await upsertRows(
    "sources",
    sources.map(({ make_collected_item, ...source }) => ({
      ...source,
      make_collected_item: Boolean(make_collected_item),
    })),
    "id",
  );

  const { error: reportError } = await supabase.from("collection_reports").upsert(
    {
      id: "latest",
      report: collectionReport,
      collected_at: collectionReport.collected_at ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (reportError) {
    throw reportError;
  }

  console.log(`Synced ${impactItems.length} impact items`);
  console.log(`Synced ${sources.length} sources`);
  console.log("Synced latest collection report");
} catch (error) {
  console.error("Supabase sync failed:");
  console.error(formatError(error));
  process.exit(1);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function loadEnvFile(filePath) {
  try {
    const content = await readFile(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);

      if (!match) {
        continue;
      }

      const [, key, value] = match;
      const parsedValue = value.replace(/^["']|["']$/g, "");

      if (!process.env[key] && parsedValue) {
        process.env[key] = parsedValue;
      }
    }
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
}

function toImpactRow(item) {
  const { id, ...row } = item;
  delete row.distance_m;
  delete row.relevance_score;

  return {
    ...row,
    external_id: id,
    impacts: row.impacts ?? [],
  };
}

async function upsertRows(table, rows, onConflict) {
  if (rows.length === 0) {
    console.log(`Skipped ${table}: no rows`);
    return;
  }

  for (let index = 0; index < rows.length; index += 500) {
    const batch = rows.slice(index, index + 500);
    const { error } = await supabase.from(table).upsert(batch, { onConflict });

    if (error) {
      throw error;
    }
  }
}

function formatError(error) {
  if (!error || typeof error !== "object") {
    return String(error);
  }

  return JSON.stringify(
    {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    },
    null,
    2,
  );
}
