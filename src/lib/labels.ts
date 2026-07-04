import type { ImpactCategory } from "@/lib/types";

export const categoryLabels: Record<ImpactCategory, string> = {
  traffic: "교통",
  construction: "공사",
  urban_plan: "도시계획",
  council: "의회",
  public_notice: "고시공고",
  event: "행사",
  safety: "안전",
  parking: "주차",
  heat: "무더위",
  facility: "공공시설",
  welfare: "복지",
  environment: "환경",
};

export function sourceKindLabel(kind?: string) {
  const labels: Record<string, string> = {
    official_html: "공식 웹",
    public_data_metadata: "공공데이터",
    openapi_metadata: "공공 API",
    standard_data_metadata: "표준데이터",
    normalized_reference: "정규화 레퍼런스",
  };

  return kind ? labels[kind] ?? kind : "유형 미상";
}

export function sourceStatusLabel(sourceStatus?: string) {
  if (sourceStatus === "collected") {
    return "수집 완료";
  }

  if (sourceStatus === "metadata_reference") {
    return "메타데이터 근거";
  }

  if (sourceStatus?.startsWith("http_")) {
    return `HTTP ${sourceStatus.replace("http_", "")}`;
  }

  return sourceStatus ?? "상태 미상";
}

export function priorityLabel(priority?: string) {
  const labels: Record<string, string> = {
    high: "상",
    medium: "중",
    low: "하",
  };

  return priority ? labels[priority] ?? priority : "미지정";
}
