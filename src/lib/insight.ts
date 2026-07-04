import type { ImpactItem } from "@/lib/types";

export function buildInsight(items: ImpactItem[]) {
  if (items.length === 0) {
    return {
      headline: "현재 선택한 주소 주변에서 확인된 생활영향 정보가 없습니다.",
      bullets: [
        "주소를 더 넓은 범위로 검색하거나 관심 주소 알림을 등록하면 새 공고가 올라올 때 확인할 수 있습니다.",
      ],
      next_actions: ["반경을 1km로 넓혀 다시 확인", "달서구 고시공고 원문 검색"],
    };
  }

  const nearest = items[0];
  const dueItems = items.filter((item) => item.opinion_due_at);
  const impactCounts = new Map<string, number>();

  for (const item of items) {
    for (const impact of item.impacts) {
      impactCounts.set(impact, (impactCounts.get(impact) ?? 0) + 1);
    }
  }

  const topImpacts = [...impactCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([impact]) => impact);

  return {
    headline: `${items.length}건의 관련 행정정보가 발견됐고, 가장 가까운 이슈는 ${nearest.distance_m?.toLocaleString()}m 거리에 있습니다.`,
    bullets: [
      `주요 영향은 ${topImpacts.join(", ")} 항목으로 분류됩니다.`,
      dueItems.length > 0
        ? `${dueItems.length}건은 의견 제출 기한이 있어 마감일 확인이 필요합니다.`
        : "현재 의견 제출 기한이 있는 항목은 없습니다.",
      "생활영향 요약은 공식·공공 출처를 쉬운 말로 정리한 참고 정보이며, 최종 판단은 원문과 담당 부서 확인이 필요합니다.",
    ],
    next_actions: [
      "가장 가까운 이슈의 원문 확인",
      "의견 제출 기한이 있는 항목 먼저 검토",
      "통행·주차 영향이 있는 일정은 생활 일정에 반영",
    ],
  };
}
