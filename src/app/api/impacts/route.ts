import { NextRequest, NextResponse } from "next/server";
import { resolveAddress, withDistanceAndScore } from "@/lib/geo";
import { buildInsight } from "@/lib/insight";
import { readLocalImpactItems } from "@/lib/local-data";
import { sampleImpactItems } from "@/lib/sample-data";
import type { ImpactItem, ImpactSearchResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("address") ?? "달서구청";
  const radiusM = Number(searchParams.get("radius") ?? 1000);
  const center = resolveAddress(query);

  let source: ImpactSearchResponse["source"] = "sample";
  let rows: ImpactItem[] = sampleImpactItems;
  const localRows = await readLocalImpactItems();

  if (localRows.length > 0) {
    source = "local_file";
    rows = localRows;
  }

  const items = withDistanceAndScore(rows, center, radiusM);

  return NextResponse.json({
    query,
    center,
    radius_m: radiusM,
    generated_at: new Date().toISOString(),
    source,
    items,
    insight: buildInsight(items),
  } satisfies ImpactSearchResponse);
}
