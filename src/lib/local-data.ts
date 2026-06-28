import { promises as fs } from "fs";
import path from "path";
import type { ImpactItem } from "@/lib/types";

const localDataPath = path.join(process.cwd(), "data", "impact-items.json");

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

function isMissingFileError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
