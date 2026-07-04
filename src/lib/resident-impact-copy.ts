import { categoryLabels } from "@/lib/labels";
import type { ImpactItem } from "@/lib/types";

const sourcePreviewPhrases = ["원문 수집", "공식 또는 공공 원문", "원문 미리보기"];

const categoryTitleBuilders: Record<ImpactItem["category"], (place: string, item: ImpactItem) => string> = {
  traffic: (place) => `${place} 이동 지연 가능`,
  construction: (place) => `${place} 공사·정비로 소음이나 통행 변화 가능`,
  urban_plan: (place) => `${place} 개발·도시계획 변화 확인`,
  council: (place) => `${place} 생활 민원·정책 논의 확인`,
  public_notice: (place) => `${place} 행정 공고로 생활 변화 확인`,
  event: (place) =>
    place.includes("행사")
      ? `${place}로 주차·소음·보행 혼잡 가능`
      : `${place} 행사로 주차·소음·보행 혼잡 가능`,
  safety: (place) => `${place} 보행 안전 확인 필요`,
  parking: (place) => `${place} 주차 혼잡 가능`,
  heat: (place) => `${place} 폭염 시 쉬어갈 곳 확인`,
  facility: (place) => `${place} 방문객 증가로 주변 혼잡 가능`,
  welfare: (place) => `${place} 복지·돌봄 이용 정보 확인`,
  environment: (place) => `${place} 소음·악취 등 생활환경 확인`,
};

const categorySummaryBuilders: Record<ImpactItem["category"], (place: string, item: ImpactItem) => string> = {
  traffic: (place, item) =>
    `${place} 주변 이동이 평소보다 늦어질 수 있습니다. ${impactText(item)} 이동 전 우회로와 대중교통 지연 여부를 확인하세요.`,
  construction: (place, item) =>
    `${place} 주변 정비나 공사성 정보입니다. ${impactText(item)} 소음, 보행로 변경, 임시 통행 제한 가능성을 먼저 보세요.`,
  urban_plan: (place, item) =>
    `${place} 주변 개발·도시계획 변화 가능성이 있습니다. ${impactText(item)} 생활도로, 상권, 보행 동선이 달라질 수 있습니다.`,
  council: (place, item) =>
    `${place} 생활권과 관련된 정책 논의입니다. ${impactText(item)} 실제 적용 여부와 향후 절차를 원문에서 확인하세요.`,
  public_notice: (place, item) =>
    `${place} 주변 생활과 연결될 수 있는 행정 공고입니다. ${impactText(item)} 일정, 위치, 의견 제출 여부를 확인하세요.`,
  event: (place, item) =>
    `${place} 주변 행사나 방문객 증가로 혼잡이 생길 수 있습니다. ${impactText(item)} 차량 방문 전 주차와 귀가 동선을 확인하세요.`,
  safety: (place, item) =>
    `${place} 주변 보행·생활안전 확인이 필요한 항목입니다. ${impactText(item)} 등하교, 야간 이동, 차량 진입 구간을 먼저 보세요.`,
  parking: (place, item) =>
    `${place} 주변 주차 수요가 몰릴 수 있습니다. ${impactText(item)} 방문 전 공영주차장, 대체 주차, 혼잡 시간대를 확인하세요.`,
  heat: (place, item) =>
    `${place} 주변 폭염 대응에 도움이 되는 정보입니다. ${impactText(item)} 오래 걷기 전 가까운 실내 쉼터를 확인하세요.`,
  facility: (place, item) =>
    `${place} 주변 공공시설 이용이나 방문객 증가와 관련된 정보입니다. ${impactText(item)} 주차, 보행, 운영 시간을 함께 확인하세요.`,
  welfare: (place, item) =>
    `${place} 주변 복지·돌봄 이용과 관련된 정보입니다. ${impactText(item)} 운영 시간, 대상, 이동 부담을 확인하세요.`,
  environment: (place, item) =>
    `${place} 주변 소음, 악취, 보행환경 같은 생활환경을 확인해야 합니다. ${impactText(item)} 반복되는 시간과 위치를 기록해두면 민원 확인에 도움이 됩니다.`,
};

export function isResidentVisibleImpact(item: ImpactItem) {
  const haystack = [item.id, item.title, item.summary, item.plain_summary].join(" ");

  return !sourcePreviewPhrases.some((phrase) => haystack.includes(phrase));
}

export function toResidentImpactItem(item: ImpactItem): ImpactItem {
  if (item.source_type === "openapi_live" && !needsResidentRewrite(item)) {
    return item;
  }

  const place = getDisplayPlace(item);
  const title = needsResidentRewrite(item)
    ? categoryTitleBuilders[item.category](place, item)
    : cleanupTitle(item.title);
  const plain_summary = needsSummaryRewrite(item)
    ? categorySummaryBuilders[item.category](place, item)
    : cleanupSummary(item.plain_summary);

  return {
    ...item,
    title,
    summary: needsSummaryRewrite(item) ? plain_summary : cleanupSummary(item.summary),
    plain_summary,
  };
}

function needsResidentRewrite(item: ImpactItem) {
  return (
    item.title.includes("영향권") ||
    item.title.includes("원문 수집") ||
    item.title.includes("이용 영향") ||
    item.title.includes("확인 영향")
  );
}

function needsSummaryRewrite(item: ImpactItem) {
  const text = `${item.summary} ${item.plain_summary}`;

  return sourcePreviewPhrases.some((phrase) => text.includes(phrase));
}

function cleanupTitle(title: string) {
  return title
    .replace(/\s*영향권/g, "")
    .replace(/\s*원문 수집/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanupSummary(summary: string) {
  return summary
    .replace(/\s*영향권/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getDisplayPlace(item: ImpactItem) {
  const titlePlace = cleanupTitle(item.title)
    .split(/주변|일원|구간|확인|이용|혼잡|접근|수요|보행안전|생활안전|생활환경|생활도로|생활권|도시계획|개발|공사|정비|방문/)[0]
    .replace(/달서구청 고시공고 행정정보/g, "달서구청 주변")
    .trim();

  if (titlePlace.length >= 2 && !titlePlace.includes("원문")) {
    return normalizePlace(titlePlace);
  }

  if (item.dong) {
    return `${item.dong} 주변`;
  }

  const addressPart = item.address.split(" ").slice(-2).join(" ").trim();
  return addressPart ? `${addressPart} 주변` : "이 위치 주변";
}

function normalizePlace(place: string) {
  if (place.endsWith("주변")) {
    return place;
  }

  if (place.endsWith("네거리") || place.endsWith("역") || place.endsWith("시장") || place.endsWith("공원")) {
    return `${place} 주변`;
  }

  return place;
}

function impactText(item: ImpactItem) {
  const impacts = item.impacts.length > 0 ? item.impacts.slice(0, 3).join(", ") : categoryLabels[item.category];
  return `주요 영향은 ${impacts}입니다.`;
}
