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
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const lat = latParam === null ? Number.NaN : Number(latParam);
  const lng = lngParam === null ? Number.NaN : Number(lngParam);
  const hasCoordinates = latParam !== null && lngParam !== null && isUsableCoordinate(lat, lng);
  const center = hasCoordinates
    ? {
        label: query,
        address: query,
        lat,
        lng,
      }
    : resolveAddress(query);

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

function isUsableCoordinate(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) > 1 && Math.abs(lng) > 1;
}
