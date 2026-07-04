import { promises as fs } from "fs";
import path from "path";
import type {
  CollectionReport,
  DeepCollectionReport,
  ImpactItem,
  SourceRecord,
} from "@/lib/types";

const localDataPath = path.join(process.cwd(), "data", "impact-items.json");
const localSourcesPath = path.join(process.cwd(), "data", "sources.json");
const localCollectionReportPath = path.join(process.cwd(), "data", "collection-report.json");
const localDeepCollectionReportPath = path.join(
  process.cwd(),
  "data",
  "deep-collection-report.json",
);

export async function readLocalImpactItems() {
  try {
    const content = await fs.readFile(localDataPath, "utf8");
    const parsed = JSON.parse(content) as { items?: ImpactItem[] } | ImpactItem[];

    if (Array.isArray(parsed)) {
      return parsed;
    }

    return parsed.items ?? [];
  } catch (error) {
    if (isMissingFileError(error)) {
      return [];
    }

    console.error("Failed to read local impact data", error);
    return [];
  }
}

export async function readLocalSources() {
  try {
    const content = await fs.readFile(localSourcesPath, "utf8");
    const parsed = JSON.parse(content) as { sources?: SourceRecord[] } | SourceRecord[];

    if (Array.isArray(parsed)) {
      return parsed;
    }

    return parsed.sources ?? [];
  } catch (error) {
    if (isMissingFileError(error)) {
      return [];
    }

    console.error("Failed to read local source data", error);
    return [];
  }
}

export async function readLocalCollectionReport() {
  try {
    const content = await fs.readFile(localCollectionReportPath, "utf8");
    return JSON.parse(content) as CollectionReport;
  } catch (error) {
    if (isMissingFileError(error)) {
      return null;
    }

    console.error("Failed to read local collection report", error);
    return null;
  }
}

export async function readLocalDeepCollectionReport() {
  try {
    const content = await fs.readFile(localDeepCollectionReportPath, "utf8");
    return JSON.parse(content) as DeepCollectionReport;
  } catch (error) {
    if (isMissingFileError(error)) {
      return null;
    }

    console.error("Failed to read local deep collection report", error);
    return null;
  }
}

function isMissingFileError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
