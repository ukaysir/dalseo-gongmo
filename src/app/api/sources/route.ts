import { NextResponse } from "next/server";
import { readSources } from "@/lib/data-source";

export const dynamic = "force-dynamic";

export async function GET() {
  const sources = await readSources();

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    source_count: sources.length,
    status_counts: countBy(sources, "source_status"),
    kind_counts: countBy(sources, "kind"),
    sources,
  });
}

function countBy<T extends Record<string, unknown>>(rows: T[], key: keyof T) {
  return rows.reduce<Record<string, number>>((counts, row) => {
    const value = String(row[key] ?? "unknown");
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}
