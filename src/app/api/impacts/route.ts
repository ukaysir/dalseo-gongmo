import { NextRequest, NextResponse } from "next/server";
import { resolveAddress, withDistanceAndScore } from "@/lib/geo";
import { buildInsight } from "@/lib/insight";
import { readImpactItemsWithSource } from "@/lib/data-source";
import { readLiveImpactItems } from "@/lib/live-impact-data";
import { isResidentVisibleImpact, toResidentImpactItem } from "@/lib/resident-impact-copy";
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
  const [dataSource, liveItems] = await Promise.all([
    readImpactItemsWithSource(),
    readLiveImpactItems(),
  ]);

  if (dataSource.items.length > 0) {
    source = dataSource.source;
    rows = dataSource.items;
  }

  if (liveItems.length > 0) {
    rows = mergeImpactItems(liveItems, rows);
    source = source === "sample" ? "public_api" : `${source}+public_api`;
  }

  const residentRows = rows.filter(isResidentVisibleImpact).map(toResidentImpactItem);
  const items = withDistanceAndScore(residentRows, center, radiusM);

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

function mergeImpactItems(primary: ImpactItem[], fallback: ImpactItem[]) {
  const seen = new Set<string>();
  const merged: ImpactItem[] = [];

  for (const item of [...primary, ...fallback]) {
    if (seen.has(item.id)) {
      continue;
    }

    seen.add(item.id);
    merged.push(item);
  }

  return merged;
}
