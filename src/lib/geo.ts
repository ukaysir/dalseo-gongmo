import { addressCandidates } from "@/lib/sample-data";
import type { AddressCandidate, ImpactItem } from "@/lib/types";

const EARTH_RADIUS_M = 6371000;

export function distanceMeters(
  from: Pick<AddressCandidate, "lat" | "lng">,
  to: Pick<ImpactItem, "lat" | "lng">,
) {
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const deltaLat = toRad(to.lat - from.lat);
  const deltaLng = toRad(to.lng - from.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_M * c);
}

export function resolveAddress(query: string): AddressCandidate {
  const normalized = query.trim().toLowerCase();
  const candidate = addressCandidates.find((item) => {
    const haystack = `${item.label} ${item.address}`.toLowerCase();
    return haystack.includes(normalized) || normalized.includes(item.label.toLowerCase());
  });

  return (
    candidate ?? {
      label: query.trim() || "달서구청",
      address: query.trim() || "대구광역시 달서구 학산로 45",
      lat: addressCandidates[0].lat,
      lng: addressCandidates[0].lng,
    }
  );
}

export function withDistanceAndScore(
  items: ImpactItem[],
  center: AddressCandidate,
  radiusM: number,
) {
  return items
    .map((item) => {
      const distance_m = distanceMeters(center, item);
      const distanceScore = Math.max(0, 100 - Math.round((distance_m / radiusM) * 60));
      const dueScore = item.opinion_due_at ? 18 : 0;
      const urgencyScore = urgencyWeight(item.urgency);
      const categoryScore = categoryWeight(item.category);
      const sourceScore = item.source_status === "collected" ? 5 : 0;
      const relevance_score = Math.min(
        100,
        distanceScore + dueScore + urgencyScore + categoryScore + sourceScore,
      );

      return {
        ...item,
        distance_m,
        relevance_score,
      };
    })
    .filter((item) => item.distance_m <= radiusM)
    .sort((a, b) => {
      const urgencyDelta = urgencyWeight(b.urgency) - urgencyWeight(a.urgency);
      if (urgencyDelta !== 0) {
        return urgencyDelta;
      }

      if ((b.relevance_score ?? 0) !== (a.relevance_score ?? 0)) {
        return (b.relevance_score ?? 0) - (a.relevance_score ?? 0);
      }

      return (a.distance_m ?? 0) - (b.distance_m ?? 0);
    });
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function urgencyWeight(urgency?: string) {
  if (urgency === "마감 임박") {
    return 25;
  }

  if (urgency === "긴급") {
    return 22;
  }

  if (urgency === "확인 필요") {
    return 14;
  }

  if (urgency === "계절 확인") {
    return 8;
  }

  return 0;
}

function categoryWeight(category: ImpactItem["category"]) {
  if (category === "traffic" || category === "safety") {
    return 8;
  }

  if (category === "urban_plan" || category === "construction") {
    return 5;
  }

  if (category === "heat" || category === "welfare") {
    return 3;
  }

  return 0;
}
