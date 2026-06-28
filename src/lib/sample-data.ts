import type { AddressCandidate, ImpactItem } from "@/lib/types";

export const addressCandidates: AddressCandidate[] = [
  {
    label: "달서구청",
    address: "대구광역시 달서구 학산로 45",
    lat: 35.82982,
    lng: 128.53273,
  },
  {
    label: "상인역",
    address: "대구광역시 달서구 월배로 223",
    lat: 35.81816,
    lng: 128.53744,
  },
  {
    label: "월성동 행정복지센터",
    address: "대구광역시 달서구 학산로 54",
    lat: 35.82903,
    lng: 128.52972,
  },
  {
    label: "두류공원",
    address: "대구광역시 달서구 공원순환로 36",
    lat: 35.85268,
    lng: 128.55819,
  },
  {
    label: "성서산업단지역",
    address: "대구광역시 달서구 달구벌대로 1280",
    lat: 35.85144,
    lng: 128.50621,
  },
];

export const sampleImpactItems: ImpactItem[] = [
  {
    id: "sample-urban-1",
    title: "월성권 생활도로 정비 도시관리계획 주민의견청취",
    category: "urban_plan",
    source_name: "달서구 고시공고",
    source_url: "https://dalseo.daegu.kr/",
    address: "대구광역시 달서구 월성동 281 일원",
    dong: "월성동",
    lat: 35.8293,
    lng: 128.5304,
    starts_at: "2026-07-01",
    ends_at: "2026-08-12",
    opinion_due_at: "2026-07-18",
    summary:
      "월성동 일대 생활도로 폭원 조정과 보행환경 개선을 위한 도시관리계획 변경안 열람 공고입니다.",
    plain_summary:
      "월성동 주변 도로와 보행로를 정비하는 계획입니다. 집이나 가게가 근처라면 통행 방식, 주차, 보행 동선에 영향이 있을 수 있습니다.",
    impacts: ["보행", "주차", "상권", "통학"],
    action_guide:
      "공고문 열람 후 의견이 있으면 마감일 전 도시디자인과로 의견서를 제출합니다.",
    department: "도시디자인과",
    contact: "053-000-0000",
    updated_at: "2026-06-28T01:00:00.000Z",
  },
  {
    id: "sample-traffic-1",
    title: "상인역네거리 야간 차로 부분 통제",
    category: "traffic",
    source_name: "대구 교통통제 정보",
    source_url: "https://car.daegu.go.kr/",
    address: "대구광역시 달서구 상인동 상인역네거리",
    dong: "상인동",
    lat: 35.8181,
    lng: 128.5378,
    starts_at: "2026-07-03",
    ends_at: "2026-07-05",
    opinion_due_at: null,
    summary:
      "상수도관 점검 공사로 상인역네거리 일부 차로가 야간 시간대 제한됩니다.",
    plain_summary:
      "상인역 근처를 밤에 차량으로 이동하면 정체나 우회가 필요할 수 있습니다. 버스 정류장 접근도 평소보다 불편할 수 있습니다.",
    impacts: ["통행", "대중교통", "소음", "주차"],
    action_guide:
      "야간 이동은 월배로 우회 경로를 확인하고, 영업장은 배달 동선을 사전에 안내합니다.",
    department: "교통행정과",
    contact: "053-000-0000",
    updated_at: "2026-06-28T01:10:00.000Z",
  },
  {
    id: "sample-council-1",
    title: "달서구의회 5분 자유발언: 어린이공원 시설 개선",
    category: "council",
    source_name: "달서구의회 회의록",
    source_url: "https://tv.dalseocouncil.daegu.kr/",
    address: "대구광역시 달서구 본리동 670 일원",
    dong: "본리동",
    lat: 35.8375,
    lng: 128.5416,
    starts_at: "2026-06-20",
    ends_at: null,
    opinion_due_at: null,
    summary:
      "본리동 어린이공원 노후 시설, 야간 조도, 보행 접근성 개선 필요성이 제기되었습니다.",
    plain_summary:
      "본리동 공원 시설 개선이 의회에서 논의됐습니다. 당장 공사가 확정된 것은 아니지만 향후 예산 편성과 현장 점검으로 이어질 수 있습니다.",
    impacts: ["안전", "보행", "생활편의"],
    action_guide:
      "공원 이용 불편 사항은 사진과 위치를 포함해 민원으로 제출하면 후속 검토에 도움이 됩니다.",
    department: "공원녹지과",
    contact: "053-000-0000",
    updated_at: "2026-06-28T01:20:00.000Z",
  },
  {
    id: "sample-event-1",
    title: "두류공원 문화행사 주변 주차 혼잡 예고",
    category: "event",
    source_name: "달서구 보도자료",
    source_url: "https://dalseo.daegu.kr/",
    address: "대구광역시 달서구 공원순환로 36",
    dong: "두류동",
    lat: 35.8527,
    lng: 128.5582,
    starts_at: "2026-07-11",
    ends_at: "2026-07-12",
    opinion_due_at: null,
    summary:
      "두류공원 일대 문화행사 개최로 주변 도로와 공영주차장 혼잡이 예상됩니다.",
    plain_summary:
      "행사 기간 두류공원 주변은 주차와 차량 이동이 평소보다 어렵습니다. 대중교통 이용이나 방문 시간 조정이 필요합니다.",
    impacts: ["주차", "통행", "소음", "상권"],
    action_guide:
      "행사장 방문자는 대중교통을 이용하고, 인근 주민은 행사 시간대 차량 이동을 피하는 것이 좋습니다.",
    department: "문화관광과",
    contact: "053-000-0000",
    updated_at: "2026-06-28T01:30:00.000Z",
  },
  {
    id: "sample-construction-1",
    title: "성서산업단지 인근 보도블록 정비공사",
    category: "construction",
    source_name: "달서구 공사 안내",
    source_url: "https://dalseo.daegu.kr/",
    address: "대구광역시 달서구 갈산동 성서산업단지역 일원",
    dong: "갈산동",
    lat: 35.851,
    lng: 128.5065,
    starts_at: "2026-07-08",
    ends_at: "2026-07-25",
    opinion_due_at: null,
    summary:
      "성서산업단지역 주변 보행로 정비로 일부 구간 보행 우회가 필요합니다.",
    plain_summary:
      "출퇴근 시간 성서산업단지역 주변 보행 동선이 바뀔 수 있습니다. 휠체어, 유모차 이용자는 임시 보행로 위치를 확인해야 합니다.",
    impacts: ["보행", "통근", "교통약자", "안전"],
    action_guide:
      "현장 안내 표지를 확인하고, 위험 구간은 구청 담당 부서에 사진과 함께 신고합니다.",
    department: "건설과",
    contact: "053-000-0000",
    updated_at: "2026-06-28T01:40:00.000Z",
  },
];
