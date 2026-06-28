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
      const dueScore = item.opinion_due_at ? 20 : 0;
      const relevance_score = Math.min(100, distanceScore + dueScore);

      return {
        ...item,
        distance_m,
        relevance_score,
      };
    })
    .filter((item) => item.distance_m <= radiusM)
    .sort((a, b) => {
      if ((b.relevance_score ?? 0) !== (a.relevance_score ?? 0)) {
        return (b.relevance_score ?? 0) - (a.relevance_score ?? 0);
      }

      return (a.distance_m ?? 0) - (b.distance_m ?? 0);
    });
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}
