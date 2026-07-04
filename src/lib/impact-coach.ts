import { categoryLabels } from "@/lib/labels";
import type { ImpactItem } from "@/lib/types";

export type LifeProfileKey =
  | "resident"
  | "driver"
  | "transit"
  | "business"
  | "childcare"
  | "senior";

type LifeProfile = {
  key: LifeProfileKey;
  label: string;
  description: string;
  concerns: string[];
  actionHint: string;
};

export type CoachOutput = {
  headline: string;
  priority: string;
  reason: string;
  actions: string[];
  watchouts: string[];
};

export const lifeProfiles: LifeProfile[] = [
  {
    key: "resident",
    label: "거주자",
    description: "소음, 보행, 주차, 생활편의",
    concerns: ["소음", "보행", "안전", "주차", "생활편의"],
    actionHint: "생활 동선과 주차 대안을 먼저 확인하세요.",
  },
  {
    key: "driver",
    label: "차량 이용",
    description: "통행, 주차, 우회, 정체",
    concerns: ["통행", "주차", "교통", "정체", "우회"],
    actionHint: "출발 전에 우회로와 주차 가능성을 확인하세요.",
  },
  {
    key: "transit",
    label: "대중교통",
    description: "정류장, 환승, 통근, 보행",
    concerns: ["대중교통", "통근", "보행", "환승", "교통약자"],
    actionHint: "정류장 접근과 도보 구간 변화를 확인하세요.",
  },
  {
    key: "business",
    label: "상가 운영",
    description: "상권, 접근, 주차, 소음",
    concerns: ["상권", "주차", "통행", "소음", "접근"],
    actionHint: "고객 접근성과 영업시간대 혼잡 가능성을 확인하세요.",
  },
  {
    key: "childcare",
    label: "등하교/돌봄",
    description: "통학, 안전, 보행, 행사",
    concerns: ["통학", "보행", "안전", "어린이", "행사"],
    actionHint: "등하교 시간대 보행로와 보호자 동선을 확인하세요.",
  },
  {
    key: "senior",
    label: "고령층/돌봄",
    description: "복지, 보행, 교통약자, 무더위",
    concerns: ["고령층", "복지", "보행", "교통약자", "무더위", "안전"],
    actionHint: "이동 부담과 복지시설 접근 변화를 확인하세요.",
  },
];

export function getLifeProfile(profileKey: LifeProfileKey) {
  return lifeProfiles.find((profile) => profile.key === profileKey) ?? lifeProfiles[0];
}

export function buildImpactCoach({
  items,
  selectedItem,
  profileKey,
  centerAddress,
}: {
  items: ImpactItem[];
  selectedItem: ImpactItem | null;
  profileKey: LifeProfileKey;
  centerAddress: string;
}): CoachOutput {
  const profile = getLifeProfile(profileKey);

  if (items.length === 0) {
    return {
      headline: `${profile.label} 기준으로 확인할 주변 이슈가 없습니다.`,
      priority: "반경을 넓히거나 다른 위치를 선택하세요.",
      reason: `${centerAddress} 주변에 현재 필터 조건과 맞는 항목이 없습니다.`,
      actions: [
        "반경을 1km 또는 2km로 넓혀 다시 확인하세요.",
        "고시공고와 행사 정보는 원문 갱신 시점이 다를 수 있어 주기적으로 다시 확인하세요.",
      ],
      watchouts: ["데이터가 없는 상태는 영향이 없다는 뜻이 아니라 수집된 항목이 없다는 뜻입니다."],
    };
  }

  const rankedItems = [...items].sort((a, b) => {
    return scoreItemForProfile(b, profile) - scoreItemForProfile(a, profile);
  });
  const focusItem = selectedItem ?? rankedItems[0];
  const nearestItem = [...items].sort((a, b) => {
    return (a.distance_m ?? Number.MAX_SAFE_INTEGER) - (b.distance_m ?? Number.MAX_SAFE_INTEGER);
  })[0];
  const matchedConcerns = getMatchedConcerns(focusItem, profile);
  const mainConcern = matchedConcerns[0] ?? focusItem.impacts[0] ?? categoryLabels[focusItem.category];
  const profileMatches = rankedItems.filter((item) => getMatchedConcerns(item, profile).length > 0);

  return {
    headline: `${profile.label} 기준으로 ${mainConcern} 영향을 먼저 보세요.`,
    priority: `${focusItem.title} 항목이 현재 조건에서 우선 확인 대상입니다.`,
    reason:
      profileMatches.length > 0
        ? `${profile.label} 관심사와 맞는 항목이 ${profileMatches.length}건이고, 기준 위치는 ${centerAddress}입니다.`
        : `${profile.label} 관심사와 직접 일치하는 항목은 적지만, 가까운 거리와 마감 정보를 기준으로 정렬했습니다.`,
    actions: [
      `${focusItem.address} 주변의 기간과 담당 부서를 먼저 확인하세요.`,
      `${profile.actionHint}`,
      nearestItem.id === focusItem.id
        ? "가장 가까운 항목이기도 하므로 실제 이동 전 원문을 열어 최신 여부를 확인하세요."
        : `가장 가까운 항목은 ${nearestItem.title}입니다. 시간 여유가 없으면 가까운 항목부터 확인하세요.`,
    ],
    watchouts: [
      focusItem.opinion_due_at
        ? `의견 제출 기한이 ${focusItem.opinion_due_at}입니다. 필요하면 기한 전에 원문을 확인하세요.`
        : "의견 제출 기한이 없는 항목은 안내성 정보일 수 있어 원문에서 적용 기간을 확인하세요.",
      "위치가 추정된 데이터는 실제 공사 지점이나 행사 범위와 다를 수 있습니다.",
    ],
  };
}

export function explainIssueForProfile(item: ImpactItem, profileKey: LifeProfileKey) {
  const profile = getLifeProfile(profileKey);
  const matchedConcerns = getMatchedConcerns(item, profile);
  const concernText =
    matchedConcerns.length > 0
      ? matchedConcerns.slice(0, 3).join(", ")
      : item.impacts.slice(0, 3).join(", ") || categoryLabels[item.category];
  const distanceText =
    item.distance_m === undefined ? "기준 위치 주변" : `기준 위치에서 약 ${item.distance_m.toLocaleString()}m`;

  return `${profile.label} 관점에서는 ${concernText} 영향을 확인해야 합니다. 이 이슈는 ${distanceText}에 있고, ${profile.actionHint} 원문에서 기간과 담당 부서를 확인한 뒤 실제 이동 또는 생활 동선에 반영하세요.`;
}

function scoreItemForProfile(item: ImpactItem, profile: LifeProfile) {
  const concernScore = getMatchedConcerns(item, profile).length * 20;
  const urgencyScore = item.urgency === "긴급" || item.urgency === "마감 임박" ? 18 : 0;
  const dueScore = item.opinion_due_at ? 10 : 0;
  const distanceScore = Math.max(0, 16 - Math.floor((item.distance_m ?? 2000) / 150));

  return concernScore + urgencyScore + dueScore + distanceScore + (item.relevance_score ?? 0);
}

function getMatchedConcerns(item: ImpactItem, profile: LifeProfile) {
  const haystack = [
    categoryLabels[item.category],
    item.title,
    item.plain_summary,
    item.action_guide,
    ...item.impacts,
  ].join(" ");

  return profile.concerns.filter((concern) => haystack.includes(concern));
}
