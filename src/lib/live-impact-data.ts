import type { ImpactItem } from "@/lib/types";
import { addressCandidates } from "@/lib/sample-data";

const daeguIncidentApiUrl =
  process.env.DAEGU_TRAFFIC_INCIDENT_API_URL ??
  "https://apis.data.go.kr/6270000/service/rest/dgincident";
const daeguLinkSpeedApiUrl =
  process.env.DAEGU_LINK_SPEED_API_URL ??
  "https://apis.data.go.kr/6270000/service/rest1/linkspeed";
const slowSpeedThreshold = Number(process.env.DAEGU_LINK_SPEED_SLOW_KMH ?? 25);

type DaeguIncidentResponse = {
  header?: {
    resultCode?: string;
    resultMsg?: string;
  };
  body?: {
    items?: {
      item?: DaeguIncidentRow[] | DaeguIncidentRow;
    };
  };
};

type DaeguIncidentRow = {
  INCIDENTID?: string | number;
  INCIDENTTITLE?: string;
  INCIDENTCODE?: string | number;
  INCIDENTSUBCODE?: string | number;
  TROUBLEGRADE?: string | number;
  TRAFFICGRADE?: string;
  LOCATION?: string;
  COORDX?: string | number;
  COORDY?: string | number;
  STARTDATE?: string | number;
  ENDDATE?: string | number;
  REPORTDATE?: string | number;
  LOGDATE?: string | number;
};

type DaeguLinkSpeedResponse = {
  header?: {
    resultCode?: string;
    resultMsg?: string;
  };
  body?: {
    items?: {
      item?: DaeguLinkSpeedRow[] | DaeguLinkSpeedRow;
    };
  };
};

type DaeguLinkSpeedRow = {
  STD_LINK_ID?: string | number;
  SECTION_NM?: string;
  ROAD_NM?: string;
  START_FAC_NM?: string;
  END_FAC_NM?: string;
  LINK_SPEED?: string | number;
  LINK_TIME?: string | number;
  DIST?: string | number;
  ATMS_TM?: string | number;
};

type RoadPoint = {
  label: string;
  lat: number;
  lng: number;
};

const roadPoints: RoadPoint[] = [
  { label: "상인역네거리", lat: 35.8181, lng: 128.5378 },
  { label: "상인네거리", lat: 35.8181, lng: 128.5378 },
  { label: "월촌역네거리", lat: 35.8222, lng: 128.5364 },
  { label: "성당네거리", lat: 35.8398, lng: 128.5522 },
  { label: "두류공원네거리", lat: 35.8487, lng: 128.5588 },
  { label: "두류네거리", lat: 35.8561, lng: 128.5582 },
  { label: "신평리네거리", lat: 35.8624, lng: 128.5591 },
  { label: "평리네거리", lat: 35.8678, lng: 128.5598 },
  { label: "만평네거리", lat: 35.8734, lng: 128.5608 },
  { label: "죽전네거리", lat: 35.8506, lng: 128.5376 },
  { label: "용산우체국네거리", lat: 35.8542, lng: 128.5286 },
  { label: "서대구공단네거리", lat: 35.8674, lng: 128.5159 },
  { label: "계명대역", lat: 35.8512, lng: 128.4911 },
  { label: "성서산업단지역", lat: 35.85144, lng: 128.50621 },
  { label: "용산역", lat: 35.8494, lng: 128.5284 },
  { label: "죽전역", lat: 35.8506, lng: 128.5376 },
  { label: "두류공원", lat: 35.85268, lng: 128.55819 },
  { label: "월배역", lat: 35.8165, lng: 128.5302 },
  { label: "진천역", lat: 35.8136, lng: 128.5228 },
  { label: "대곡역", lat: 35.8092, lng: 128.5109 },
];

export async function readLiveImpactItems() {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;

  if (!serviceKey) {
    return [];
  }

  const [incidents, linkSpeeds] = await Promise.all([
    readDaeguIncidentItems(serviceKey),
    readDaeguLinkSpeedItems(serviceKey),
  ]);

  return mergeLiveItems([...incidents, ...linkSpeeds]);
}

async function readDaeguIncidentItems(serviceKey: string) {
  const url = new URL(daeguIncidentApiUrl);
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", process.env.DAEGU_TRAFFIC_INCIDENT_ROWS ?? "100");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn("Daegu traffic incident API failed", response.status);
      return [];
    }

    const payload = (await response.json()) as DaeguIncidentResponse;

    if (payload.header?.resultCode && payload.header.resultCode !== "00") {
      console.warn("Daegu traffic incident API returned error", payload.header.resultMsg);
      return [];
    }

    return toIncidentRows(payload).map(toIncidentImpactItem).filter(isUsableLiveItem);
  } catch (error) {
    console.warn("Daegu traffic incident API unavailable", error);
    return [];
  }
}

async function readDaeguLinkSpeedItems(serviceKey: string) {
  const url = new URL(daeguLinkSpeedApiUrl);
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", process.env.DAEGU_LINK_SPEED_ROWS ?? "2000");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn("Daegu link speed API failed", response.status);
      return [];
    }

    const payload = (await response.json()) as DaeguLinkSpeedResponse;

    if (payload.header?.resultCode && payload.header.resultCode !== "00") {
      console.warn("Daegu link speed API returned error", payload.header.resultMsg);
      return [];
    }

    return toLinkSpeedRows(payload)
      .filter((row) => Number(row.LINK_SPEED) > 0 && Number(row.LINK_SPEED) <= slowSpeedThreshold)
      .map(toLinkSpeedImpactItem)
      .filter((item): item is ImpactItem => item !== null)
      .slice(0, 40);
  } catch (error) {
    console.warn("Daegu link speed API unavailable", error);
    return [];
  }
}

function toIncidentRows(payload: DaeguIncidentResponse) {
  const item = payload.body?.items?.item;

  if (!item) {
    return [];
  }

  return Array.isArray(item) ? item : [item];
}

function toLinkSpeedRows(payload: DaeguLinkSpeedResponse) {
  const item = payload.body?.items?.item;

  if (!item) {
    return [];
  }

  return Array.isArray(item) ? item : [item];
}

function toIncidentImpactItem(row: DaeguIncidentRow): ImpactItem {
  const incidentCode = String(row.INCIDENTCODE ?? "");
  const grade = Number(row.TROUBLEGRADE ?? 0);
  const category = categoryForIncident(incidentCode);
  const title = row.INCIDENTTITLE?.trim() || "대구 돌발 교통정보";
  const location = row.LOCATION?.trim() || "대구광역시";
  const incidentLabel = incidentTypeLabel(incidentCode);
  const start = formatDaeguDate(row.STARTDATE);
  const end = formatDaeguDate(row.ENDDATE);
  const traffic = trafficGradeLabel(row.TRAFFICGRADE);

  return {
    id: `live-daegu-incident-${row.INCIDENTID ?? `${row.COORDX}-${row.COORDY}-${row.STARTDATE}`}`,
    source_id: "daegu-traffic-incident-live",
    title,
    category,
    source_name: "대구광역시 돌발 교통정보",
    source_url: "https://www.data.go.kr/data/15126267/openapi.do",
    source_type: "openapi_live",
    source_status: "live_api",
    address: location,
    dong: extractDong(location),
    lat: Number(row.COORDY),
    lng: Number(row.COORDX),
    starts_at: start,
    ends_at: end,
    opinion_due_at: null,
    summary: `${incidentLabel} 돌발 정보입니다. ${traffic} 상태로 표시되며, 통행 전 우회나 출발 시간 조정을 확인해야 합니다.`,
    plain_summary: `${location} 주변에 ${incidentLabel} 정보가 있습니다. 가까운 곳을 지나는 경우 정체나 우회가 생길 수 있습니다.`,
    impacts: impactsForIncident(incidentCode),
    action_guide: "출발 전 지도 앱이나 대구교통종합정보에서 우회 경로와 해제 여부를 확인하세요.",
    department: "대구광역시 교통정보운영과",
    contact: "053-803-6715",
    updated_at: formatDaeguDate(row.LOGDATE) ?? new Date().toISOString(),
    collected_at: new Date().toISOString(),
    location_confidence: "live_api_coordinate",
    summary_confidence: "live_api",
    urgency: urgencyForGrade(grade),
    is_demo: false,
    impact_radius_m: impactRadiusForGrade(grade),
  };
}

function toLinkSpeedImpactItem(row: DaeguLinkSpeedRow): ImpactItem | null {
  const section = row.SECTION_NM?.trim();
  const matchedSegment = section ? findRoadSegment(section) : null;
  const anchor =
    matchedSegment?.anchor ??
    findKnownAnchor(`${section ?? ""} ${row.ROAD_NM ?? ""} ${row.START_FAC_NM ?? ""} ${row.END_FAC_NM ?? ""}`);

  if (!section || !anchor) {
    return null;
  }

  const speed = Number(row.LINK_SPEED);
  const linkTime = Number(row.LINK_TIME);
  const distance = Number(row.DIST);
  const updatedAt = formatDaeguDate(row.ATMS_TM) ?? new Date().toISOString();
  const lat = matchedSegment?.midpoint.lat ?? anchor.lat;
  const lng = matchedSegment?.midpoint.lng ?? anchor.lng;

  return {
    id: `live-daegu-linkspeed-${stableId(section)}`,
    source_id: "daegu-link-speed-live",
    title: `${section} 구간 서행`,
    category: "traffic",
    source_name: "대구광역시 교통소통정보",
    source_url: "https://www.data.go.kr/data/15126266/openapi.do",
    source_type: "openapi_live",
    source_status: "live_api",
    address: `${row.ROAD_NM ?? "대구 도로"} ${section}`,
    dong: extractDong(anchor.address),
    lat,
    lng,
    starts_at: null,
    ends_at: null,
    opinion_due_at: null,
    summary: `${section} 구간 평균 속도가 시속 ${speed.toLocaleString()}km로 낮습니다. 통행 전 우회 또는 출발 시간 조정이 필요할 수 있습니다.`,
    plain_summary: `${anchor.label} 주변 ${section} 구간이 현재 서행 상태입니다. 차량 이동이나 버스 이용 시 지연될 수 있습니다.`,
    impacts: ["통행", "정체", "대중교통", "우회"],
    action_guide: `현재 속도는 ${speed.toLocaleString()}km/h${
      Number.isFinite(linkTime) ? `, 예상 통과 시간은 약 ${linkTime.toLocaleString()}초` : ""
    }입니다. 출발 전 우회 경로를 확인하세요.`,
    department: "대구광역시 교통정보운영과",
    contact: "053-803-6715",
    updated_at: updatedAt,
    collected_at: new Date().toISOString(),
    location_confidence: matchedSegment ? "road_segment_matched" : "known_place_matched",
    summary_confidence: "live_api",
    urgency: speed <= 15 ? "긴급" : "확인 필요",
    is_demo: false,
    impact_radius_m: Number.isFinite(distance) ? Math.min(1200, Math.max(350, Math.round(distance / 2))) : speed <= 15 ? 900 : 600,
    geometry: matchedSegment?.geometry,
  };
}

function isUsableLiveItem(item: ImpactItem) {
  return Number.isFinite(item.lat) && Number.isFinite(item.lng);
}

function categoryForIncident(code: string): ImpactItem["category"] {
  if (code === "2") {
    return "construction";
  }

  if (code === "3") {
    return "event";
  }

  if (code === "4") {
    return "safety";
  }

  return "traffic";
}

function incidentTypeLabel(code: string) {
  const labels: Record<string, string> = {
    "1": "사고",
    "2": "공사",
    "3": "행사",
    "4": "기상",
  };

  return labels[code] ?? "돌발";
}

function impactsForIncident(code: string) {
  if (code === "2") {
    return ["공사", "통행", "정체", "우회"];
  }

  if (code === "3") {
    return ["행사", "통행", "주차", "혼잡"];
  }

  if (code === "4") {
    return ["안전", "통행", "기상"];
  }

  return ["통행", "정체", "우회", "안전"];
}

function urgencyForGrade(grade: number) {
  if (grade >= 4) {
    return "긴급";
  }

  if (grade >= 2) {
    return "확인 필요";
  }

  return "참고";
}

function impactRadiusForGrade(grade: number) {
  if (grade >= 4) {
    return 1000;
  }

  if (grade >= 2) {
    return 700;
  }

  return 400;
}

function trafficGradeLabel(value?: string) {
  const labels: Record<string, string> = {
    "01": "소통 원활",
    "02": "서행",
    "03": "지체/혼잡",
  };

  return value ? labels[value] ?? `교통상태 ${value}` : "교통상태 미확인";
}

function extractDong(location: string) {
  const match = location.match(/(?:달서구|대구)\s+([^\s]+동)/);
  return match?.[1] ?? "대구";
}

function findKnownAnchor(text: string) {
  const normalized = text.toLowerCase();

  return addressCandidates.find((candidate) => {
    const label = candidate.label.toLowerCase();
    const shortLabel = label.replace(/역|공원|시장| 행정복지센터/g, "");
    const address = candidate.address.toLowerCase();

    return normalized.includes(label) || normalized.includes(shortLabel) || normalized.includes(address);
  });
}

function findRoadSegment(section: string) {
  const names = section
    .replace(/\([^)]*\)/g, "")
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean);

  if (names.length < 2) {
    return null;
  }

  const start = findRoadPoint(names[0]);
  const end = findRoadPoint(names[names.length - 1]);

  if (!start || !end) {
    return null;
  }

  const coordinates = [
    { lat: start.lat, lng: start.lng },
    { lat: end.lat, lng: end.lng },
  ];

  return {
    anchor: {
      label: `${start.label}-${end.label}`,
      address: `대구광역시 달서구 ${start.label}-${end.label}`,
      lat: start.lat,
      lng: start.lng,
    },
    midpoint: {
      lat: (start.lat + end.lat) / 2,
      lng: (start.lng + end.lng) / 2,
    },
    geometry: {
      type: "LineString" as const,
      coordinates,
    },
  };
}

function findRoadPoint(name: string) {
  const normalized = normalizeRoadName(name);

  return roadPoints.find((point) => {
    const pointName = normalizeRoadName(point.label);
    return normalized === pointName || normalized.includes(pointName) || pointName.includes(normalized);
  });
}

function normalizeRoadName(name: string) {
  return name.replace(/\s+/g, "").replace(/\([^)]*\)/g, "").trim();
}

function mergeLiveItems(items: ImpactItem[]) {
  const seen = new Set<string>();
  const merged: ImpactItem[] = [];

  for (const item of items) {
    if (seen.has(item.id)) {
      continue;
    }

    seen.add(item.id);
    merged.push(item);
  }

  return merged;
}

function stableId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^0-9a-z가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDaeguDate(value?: string | number) {
  const text = String(value ?? "");

  if (!/^\d{14}$/.test(text)) {
    return null;
  }

  return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)} ${text.slice(8, 10)}:${text.slice(10, 12)}`;
}
