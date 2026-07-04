"use client";

import {
  AlertCircle,
  CalendarClock,
  Database,
  ExternalLink,
  FileText,
  ListFilter,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
} from "lucide-react";
import dynamic from "next/dynamic";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { resolveAddress, withDistanceAndScore } from "@/lib/geo";
import {
  buildImpactCoach,
  explainIssueForProfile,
  getLifeProfile,
  lifeProfiles,
  type CoachOutput,
  type LifeProfileKey,
} from "@/lib/impact-coach";
import { buildInsight } from "@/lib/insight";
import { categoryLabels } from "@/lib/labels";
import { addressCandidates, sampleImpactItems } from "@/lib/sample-data";
import type { AddressCandidate, ImpactItem, ImpactSearchResponse } from "@/lib/types";

type FilterKey = "all" | "opinion" | ImpactItem["category"];

const categoryFilterOptions: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "traffic", label: "교통" },
  { key: "parking", label: "주차" },
  { key: "safety", label: "안전" },
  { key: "welfare", label: "복지" },
  { key: "environment", label: "환경" },
  { key: "urban_plan", label: "도시계획" },
  { key: "construction", label: "공사" },
  { key: "event", label: "행사" },
  { key: "opinion", label: "의견" },
];

const ImpactMap = dynamic(() => import("@/components/ImpactMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] items-center justify-center rounded-dalseo border border-dalseo-border bg-dalseo-panel text-sm font-semibold text-dalseo-muted xl:h-[620px]">
      지도를 불러오는 중
    </div>
  ),
});

export default function ImpactPage() {
  const [address, setAddress] = useState("달서구청");
  const [radius, setRadius] = useState(1000);
  const [data, setData] = useState<ImpactSearchResponse | null>(() =>
    createInitialResponse("달서구청", 1000),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<FilterKey>("all");
  const [isLocationPanelOpen, setIsLocationPanelOpen] = useState(false);
  const [pickedCoordinates, setPickedCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [lifeProfile, setLifeProfile] = useState<LifeProfileKey>("resident");
  const [issueAdvice, setIssueAdvice] = useState<string | null>(null);
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [aiCoach, setAiCoach] = useState<CoachOutput | null>(null);

  const displayedItems = useMemo(() => {
    return (data?.items ?? []).filter((item) =>
      matchesCategoryFilter(item, categoryFilter),
    );
  }, [categoryFilter, data]);

  const selectedItem = useMemo(() => {
    return displayedItems.find((item) => item.id === selectedId) ?? displayedItems[0] ?? null;
  }, [displayedItems, selectedId]);

  const topImpacts = useMemo(() => getTopImpacts(displayedItems), [displayedItems]);
  const fallbackCoach = useMemo(
    () =>
      buildImpactCoach({
        items: displayedItems,
        selectedItem,
        profileKey: lifeProfile,
        centerAddress: data?.center.address ?? address,
      }),
    [address, data?.center.address, displayedItems, lifeProfile, selectedItem],
  );
  const coach = aiCoach ?? fallbackCoach;
  const locationOptions = useMemo(() => {
    const normalized = address.trim().toLowerCase();

    if (!normalized) {
      return addressCandidates;
    }

    const filtered = addressCandidates.filter((candidate) => {
      const haystack = `${candidate.label} ${candidate.address}`.toLowerCase();
      return haystack.includes(normalized) || normalized.includes(candidate.label.toLowerCase());
    });

    return filtered.length > 0 ? filtered : addressCandidates;
  }, [address]);

  async function loadImpacts(nextAddress = address, nextRadius = radius) {
    setPickedCoordinates(null);
    setLocationStatus(null);
    setIssueAdvice(null);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/impacts?address=${encodeURIComponent(nextAddress)}&radius=${nextRadius}`,
      );

      if (!response.ok) {
        throw new Error("정보를 불러오지 못했습니다.");
      }

      const payload = (await response.json()) as ImpactSearchResponse;
      setData(payload);
      setSelectedId(payload.items[0]?.id ?? null);
      setIssueAdvice(null);
      setAiCoach(null);
      setCoachError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "알 수 없는 오류가 발생했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadImpactsByCoordinates(
    lat: number,
    lng: number,
    nextRadius = radius,
    nextAddress = "지도 선택 위치",
    nextLocationStatus = "지도 선택 위치 기준",
  ) {
    setAddress(nextAddress);
    setPickedCoordinates({ lat, lng });
    setLocationStatus(nextLocationStatus);
    setIssueAdvice(null);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/impacts?address=${encodeURIComponent(nextAddress)}&lat=${lat}&lng=${lng}&radius=${nextRadius}`,
      );

      if (!response.ok) {
        throw new Error("지도 위치 정보를 불러오지 못했습니다.");
      }

      const payload = (await response.json()) as ImpactSearchResponse;
      setData(payload);
      setSelectedId(payload.items[0]?.id ?? null);
      setIssueAdvice(null);
      setAiCoach(null);
      setCoachError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "알 수 없는 오류가 발생했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadImpacts();
  }

  function selectPlace(place: AddressCandidate) {
    setIsLocationPanelOpen(false);
    setIssueAdvice(null);
    void loadImpactsByCoordinates(
      place.lat,
      place.lng,
      radius,
      place.label,
      `${place.label} 기준`,
    );
  }

  function selectIssue(id: string) {
    setSelectedId(id);
    setIssueAdvice(null);
    setAiCoach(null);
    setCoachError(null);
  }

  async function loadAiCoach() {
    if (displayedItems.length === 0) {
      setAiCoach(null);
      setCoachError(null);
      return;
    }

    const profile = getLifeProfile(lifeProfile);
    const mobilityMode = movementModePrompt(profile.key);
    const nearbyItems = displayedItems.slice(0, 8).map((item) => ({
      id: item.id,
      title: item.title,
      category: categoryLabels[item.category],
      address: item.address,
      distance_m: item.distance_m ?? null,
      distance_context: movementHint(item),
      urgency: item.urgency ?? null,
      opinion_due_at: item.opinion_due_at ?? "해당 없음",
      impacts: item.impacts.join(", "),
      summary: item.plain_summary,
      isSelected: item.id === selectedItem?.id,
    }));

    const systemPrompt =
      "너는 '달서구 생활영향 코치'다. 입력된 사실 데이터만 근거로 판단하고, 단정적 추측은 피한다. " +
      "출력은 오직 순수 JSON 객체만 허용한다. 코드블록/마크다운/설명문을 포함하면 안 된다. " +
      "항상 한국어 존댓말로 답하며, 각 문장은 실무자가 바로 적용 가능한 수준으로 간결하게 작성한다.";

    const userPrompt =
      `아래 규칙으로 생활영향 코치를 작성해.\n` +
      `기준 위치: ${data?.center.address ?? address} (반경 ${data?.radius_m ?? radius}m)\n` +
      `기준 좌표: ${data?.center.lat ?? 0}, ${data?.center.lng ?? 0}\n` +
      `생활유형: ${profile.label}\n` +
      `이동성 우선순위: ${mobilityMode.mode}\n` +
      `이동 가이드: ${mobilityMode.hint}\n` +
      `관심사: ${profile.concerns.join(", ")}\n` +
      `현재 선택 항목 ID: ${selectedItem?.id ?? "선택 없음"}\n` +
      "출력 스키마:\n" +
      `{"headline":"...","priority":"...","reason":"...","actions":["","",""],"watchouts":["",""]}\n` +
      "요구:\n" +
      "1) headline: 한 줄 요약\n" +
      "2) priority: 지금 바로 확인할 핵심 한 줄\n" +
      "3) reason: 이동성(차량/대중교통/도보) 관점에서 왜 우선인지 1~2문장\n" +
      "4) actions: 지금 바로 실행 가능한 제안 3개\n" +
      "5) watchouts: 유의점 2개\n" +
      "데이터:\n" +
      `${JSON.stringify(nearbyItems, null, 2)}`;

    const messages = [
      {
        role: "system" as const,
        content: systemPrompt,
      },
      {
        role: "user" as const,
        content: userPrompt,
      },
    ];

    setAiCoach(null);
    setCoachError(null);
    setIsCoachLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyProfile: "user-default",
          model: "deepseek-v4-flash-free",
          messages,
          stream: false,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`생활영향 코치 생성 실패: ${response.status} ${response.statusText}${text ? ` / ${text}` : ""}`);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error("AI 응답이 비어있습니다.");
      }

      const chatData = safeJsonParse(responseText) as AIChatResponse | null;
      const parsedText = chatData ? extractAiText(chatData) : null;
      const payloadText = parsedText ?? responseText;
      const parsedCoach = parseCoachPayload(payloadText, fallbackCoach);

      if (!parsedCoach) {
        throw new Error("AI 응답 포맷이 예상과 다릅니다.");
      }

      setAiCoach(parsedCoach);
    } catch (coachError) {
      setCoachError(coachError instanceof Error ? coachError.message : "AI 코치를 불러오지 못했습니다.");
    } finally {
      setIsCoachLoading(false);
    }
  }

  useEffect(() => {
    void loadAiCoach();
  }, [address, data?.center.address, displayedItems, lifeProfile, selectedItem?.id]);

  function changeRadius(nextRadius: number) {
    setRadius(nextRadius);
    if (pickedCoordinates) {
      void loadImpactsByCoordinates(
        pickedCoordinates.lat,
        pickedCoordinates.lng,
        nextRadius,
        address,
        locationStatus ?? "좌표 기준 위치",
      );
      return;
    }

    void loadImpacts(address, nextRadius);
  }

  function useCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationStatus("이 브라우저에서는 현재 위치를 사용할 수 없습니다.");
      return;
    }

    setLocationStatus("현재 위치 권한을 확인하는 중입니다.");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const accuracyText = Number.isFinite(accuracy)
          ? `오차 약 ${Math.round(accuracy).toLocaleString()}m`
          : "오차 정보 없음";

        void loadImpactsByCoordinates(
          latitude,
          longitude,
          radius,
          "현재 위치",
          `현재 위치 기준 · ${accuracyText}`,
        );
      },
      (geoError) => {
        const messages: Record<number, string> = {
          [geoError.PERMISSION_DENIED]: "위치 권한이 거부되었습니다. 브라우저 주소창에서 권한을 허용하거나 지도를 눌러 기준 위치를 선택하세요.",
          [geoError.POSITION_UNAVAILABLE]: "현재 위치를 확인할 수 없습니다. 주소 검색이나 지도 선택을 사용하세요.",
          [geoError.TIMEOUT]: "현재 위치 확인 시간이 초과되었습니다. 다시 시도하거나 주소를 입력하세요.",
        };

        setLocationStatus(messages[geoError.code] ?? "현재 위치 확인 중 오류가 발생했습니다.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }

  return (
    <main className="min-h-[100dvh] bg-dalseo-bg text-dalseo-ink">
      <AppHeader />

      <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
        <section className="grid items-stretch gap-4 xl:grid-cols-2">
          <section className="surface min-w-0 overflow-visible p-5">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-sm font-bold text-dalseo-accent">
                <LocateFixed aria-hidden="true" className="size-4" />
                주소 영향
              </p>
              <h1 className="mt-2 max-w-xl text-2xl font-extrabold leading-snug text-pretty sm:text-3xl">
                내 주변 변화를 빠르게 확인
              </h1>
            </div>

            <form onSubmit={submitSearch} className="mt-4 grid gap-3">
              <div className="block">
                <label htmlFor="impact-location" className="mb-2 block text-sm font-bold">
                  위치
                </label>
                <div className="relative">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dalseo-muted"
                  />
                  <input
                    id="impact-location"
                    value={address}
                    onChange={(event) => {
                      setAddress(event.target.value);
                      setIsLocationPanelOpen(true);
                    }}
                    onFocus={() => setIsLocationPanelOpen(true)}
                    onBlur={() => setIsLocationPanelOpen(false)}
                    placeholder="주소나 장소명 입력"
                    className="h-12 w-full rounded-dalseo border border-dalseo-border bg-white pl-10 pr-3 text-sm font-medium outline-none transition focus:border-dalseo-accent focus:ring-2 focus:ring-dalseo-ring"
                  />
                  {isLocationPanelOpen ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 rounded-dalseo border border-dalseo-border bg-white p-2 shadow-[var(--shadow)]">
                      <div className="px-2 pb-2 text-xs font-bold text-dalseo-muted">
                        위치 선택
                      </div>
                      <div className="grid max-h-72 gap-1 overflow-y-auto">
                        {locationOptions.map((candidate) => (
                          <button
                            key={`${candidate.label}-${candidate.lat}-${candidate.lng}`}
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              selectPlace(candidate);
                            }}
                            className="rounded-dalseo px-3 py-2 text-left text-sm transition hover:bg-dalseo-soft focus:bg-dalseo-soft focus:outline-none"
                          >
                            <span className="block font-extrabold text-dalseo-ink">
                              {candidate.label}
                            </span>
                            <span className="mt-0.5 block text-xs leading-5 text-dalseo-muted">
                              {candidate.address}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button type="submit" disabled={isLoading} className="primary-button h-11">
                  <Navigation aria-hidden="true" className="size-4" />
                  {isLoading ? "검색 중" : "검색"}
                </button>

                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={isLoading}
                  className="secondary-button h-11 px-3 text-sm"
                >
                  <LocateFixed aria-hidden="true" className="size-4" />
                  현재 위치
                </button>
              </div>
            </form>

            <div className="mt-5 border-t border-dalseo-border pt-5">
              <LifeProfileSelector value={lifeProfile} onChange={setLifeProfile} />
            </div>
          </section>

          <CoachPanel
            coach={coach}
            profileLabel={getLifeProfile(lifeProfile).label}
            isLoading={isCoachLoading}
            error={coachError}
          />
        </section>

        {error ? (
          <section className="mt-4 surface flex gap-3 border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {error}
          </section>
        ) : null}

        <section className="mt-4 grid gap-3 lg:grid-cols-3">
          <InsightPanel
            title="가까운 변화"
            value={data?.insight.headline ?? "주변 변화를 확인합니다."}
            body={topImpacts.length > 0 ? `주요 영향: ${topImpacts.join(", ")}` : "영향 분류 없음"}
          />
          <InsightPanel
            title="먼저 볼 일"
            value={data?.insight.next_actions?.[0] ?? "원문 확인"}
            body={data?.insight.next_actions?.[1] ?? "상세 항목에서 위치와 담당 부서를 확인하세요."}
          />
          <InsightPanel
            title="선택 항목"
            value={selectedItem?.title ?? "선택된 항목 없음"}
            body={selectedItem ? `${categoryLabels[selectedItem.category]} · ${selectedItem.distance_m?.toLocaleString()}m` : "목록이나 지도의 표시를 선택하세요."}
          />
        </section>

        <section className="mt-4 grid items-start gap-4 xl:grid-cols-[340px_minmax(540px,1fr)_380px]">
          <IssueQueue
            items={displayedItems}
            selectedId={selectedItem?.id ?? null}
            categoryFilter={categoryFilter}
            onFilterChange={(filter) => {
              setCategoryFilter(filter);
              setSelectedId(null);
              setIssueAdvice(null);
              setAiCoach(null);
              setCoachError(null);
            }}
            onSelect={selectIssue}
          />

          <div className="min-w-0">
            {data ? (
              <ImpactMap
                center={data.center}
                items={displayedItems}
                radiusM={radius}
                selectedId={selectedItem?.id ?? null}
                onSelect={selectIssue}
                onRadiusChange={changeRadius}
                onPickLocation={(lat, lng) => void loadImpactsByCoordinates(lat, lng)}
              />
            ) : null}
          </div>

          <IssueDetail
            item={selectedItem}
            profileKey={lifeProfile}
            issueAdvice={issueAdvice}
            onExplain={(item) => setIssueAdvice(explainIssueForProfile(item, lifeProfile))}
          />
        </section>
      </div>
    </main>
  );
}

function LifeProfileSelector({
  value,
  onChange,
}: {
  value: LifeProfileKey;
  onChange: (profile: LifeProfileKey) => void;
}) {
  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-extrabold">생활 유형</h2>
          <p className="mt-1 text-sm leading-6 text-dalseo-muted">
            같은 이슈라도 생활 방식에 따라 먼저 봐야 할 영향이 달라집니다.
          </p>
        </div>
        <span className="meta-badge self-start sm:self-auto">추천 기준</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-3">
        {lifeProfiles.map((profile) => (
          <button
            key={profile.key}
            type="button"
            onClick={() => onChange(profile.key)}
            className={`min-h-[66px] rounded-dalseo border px-3 py-2.5 text-left transition ${
              value === profile.key
                ? "border-dalseo-accent bg-dalseo-soft text-dalseo-ink ring-2 ring-dalseo-ring"
                : "border-dalseo-border bg-white text-dalseo-muted hover:border-dalseo-accent hover:text-dalseo-ink"
            }`}
          >
            <span className="block text-sm font-extrabold">{profile.label}</span>
            <span className="mt-1 block text-xs leading-5">{profile.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function CoachPanel({
  coach,
  profileLabel,
  isLoading,
  error,
}: {
  coach: CoachOutput;
  profileLabel: string;
  isLoading: boolean;
  error: string | null;
}) {
  return (
    <section className="surface min-w-0 overflow-hidden">
      <div className="border-b border-dalseo-border bg-dalseo-soft p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-extrabold">
              <ShieldCheck aria-hidden="true" className="size-5 text-dalseo-accent" />
              생활영향 코치
            </h2>
            <p className="mt-1 text-base leading-7 text-dalseo-muted">
              {profileLabel} 기준 추천
              {isLoading ? " (AI 분석 중)" : null}
            </p>
          </div>
          <span className="meta-badge">{isLoading ? "AI 분석" : "AI 분석 완료"}</span>
        </div>
        {error ? (
          <p className="mt-3 rounded-dalseo border border-amber-200 bg-amber-50 p-2 text-xs leading-6 text-amber-800">
            AI 응답을 불완전하게 받아 기본 분석으로 보강합니다.
          </p>
        ) : null}
        <p className="mt-4 text-lg font-extrabold leading-8 text-pretty">{coach.headline}</p>
        <p className="mt-2 text-base leading-7 text-dalseo-muted">{coach.priority}</p>
      </div>

      <div className="space-y-5 p-5">
        <section>
          <h3 className="text-base font-extrabold">왜 이렇게 보나요</h3>
          <p className="mt-2 text-base leading-7 text-dalseo-muted">{coach.reason}</p>
        </section>

        <section>
          <h3 className="text-base font-extrabold">추천 행동</h3>
          <ul className="mt-2 space-y-2 text-base leading-7 text-dalseo-muted">
            {coach.actions.map((action) => (
              <li key={action} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-dalseo-accent" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-dalseo bg-white p-3">
          <h3 className="text-base font-extrabold">주의</h3>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-dalseo-muted">
            {coach.watchouts.map((watchout) => (
              <li key={watchout}>{watchout}</li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}

function IssueQueue({
  items,
  selectedId,
  categoryFilter,
  onFilterChange,
  onSelect,
}: {
  items: ImpactItem[];
  selectedId: string | null;
  categoryFilter: FilterKey;
  onFilterChange: (filter: FilterKey) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="surface min-w-0 overflow-hidden">
      <div className="border-b border-dalseo-border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-extrabold">
              <ListFilter aria-hidden="true" className="size-5 text-dalseo-accent" />
              주변 목록
            </h2>
          </div>
          <span className="meta-badge">{items.length}건</span>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {categoryFilterOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onFilterChange(option.key)}
              className={`filter-chip shrink-0 ${
                categoryFilter === option.key ? "filter-chip-active" : ""
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[560px] overflow-y-auto xl:max-h-[calc(100dvh-13rem)]">
        {items.length > 0 ? (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`issue-row ${selectedId === item.id ? "issue-row-active" : ""}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="category-badge">{categoryLabels[item.category]}</span>
                <span className={urgencyClassName(item.urgency)}>{item.urgency ?? "참고"}</span>
                <span className="meta-badge">{item.distance_m?.toLocaleString()}m</span>
              </div>
              <h3 className="mt-3 text-base font-bold leading-6 text-dalseo-ink">{item.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-dalseo-muted">
                {item.plain_summary}
              </p>
            </button>
          ))
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm font-bold">표시할 항목이 없습니다.</p>
            <p className="mt-2 text-sm leading-6 text-dalseo-muted">반경을 넓히거나 다른 위치를 선택하세요.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function IssueDetail({
  item,
  profileKey,
  issueAdvice,
  onExplain,
}: {
  item: ImpactItem | null;
  profileKey: LifeProfileKey;
  issueAdvice: string | null;
  onExplain: (item: ImpactItem) => void;
}) {
  if (!item) {
    return (
      <aside className="surface p-6 text-sm text-dalseo-muted">
        선택된 항목이 없습니다.
      </aside>
    );
  }

  return (
    <aside className="surface overflow-hidden xl:self-start">
      <div className="bg-dalseo-soft p-4">
        <div className="flex flex-wrap gap-2">
          <span className="category-badge">{categoryLabels[item.category]}</span>
          <span className={urgencyClassName(item.urgency)}>{item.urgency ?? "참고"}</span>
        </div>
        <h2 className="mt-3 text-xl font-extrabold leading-8 text-pretty">{item.title}</h2>
        <p className="mt-3 text-sm leading-6 text-dalseo-muted">{item.plain_summary}</p>
      </div>

      <div className="space-y-4 p-4">
        <InfoRow
          icon={<MapPin className="size-4" />}
          label="위치"
          value={`${item.address} · ${item.distance_m?.toLocaleString()}m`}
        />
        <InfoRow
          icon={<CalendarClock className="size-4" />}
          label="기간"
          value={formatPeriod(item.starts_at, item.ends_at)}
        />
        <InfoRow
          icon={<FileText className="size-4" />}
          label="의견 제출"
          value={item.opinion_due_at ?? "해당 없음"}
        />
        <InfoRow
          icon={<ShieldCheck className="size-4" />}
          label="출처"
          value={sourceTypeLabel(item.source_type)}
        />
        <InfoRow
          icon={<Database className="size-4" />}
          label="수집"
          value={formatDateTime(item.collected_at)}
        />

        <section className="rounded-dalseo bg-dalseo-soft p-4">
          <h3 className="text-sm font-extrabold">다음 행동</h3>
          <p className="mt-2 text-sm leading-6 text-dalseo-muted">{item.action_guide}</p>
        </section>

        <section className="rounded-dalseo border border-dalseo-border bg-white p-4">
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-extrabold">내 상황으로 다시 설명</h3>
              <p className="mt-1 text-xs leading-5 text-dalseo-muted">
                {getLifeProfile(profileKey).label} 기준으로 영향과 행동을 다시 정리합니다.
              </p>
            </div>
            <button type="button" onClick={() => onExplain(item)} className="secondary-button min-h-10 justify-center px-3">
              다시 설명
            </button>
          </div>
          {issueAdvice ? (
            <p className="mt-3 rounded-dalseo bg-dalseo-soft p-3 text-sm leading-6 text-dalseo-muted">
              {issueAdvice}
            </p>
          ) : null}
        </section>

        <section className="rounded-dalseo bg-dalseo-soft p-4">
          <h3 className="text-sm font-extrabold">담당</h3>
          <p className="mt-2 text-sm leading-6 text-dalseo-muted">
            {item.department} · {item.contact}
          </p>
        </section>

        <a href={item.source_url} target="_blank" rel="noreferrer" className="primary-button w-full">
          원문 열기
          <ExternalLink aria-hidden="true" className="size-4" />
        </a>
      </div>
    </aside>
  );
}

function InsightPanel({
  title,
  value,
  body,
}: {
  title: string;
  value: string;
  body: string;
}) {
  return (
    <article className="surface p-4">
      <h2 className="text-sm font-bold text-dalseo-muted">{title}</h2>
      <p className="mt-2 text-lg font-extrabold leading-7 text-pretty">{value}</p>
      <p className="mt-2 text-sm leading-6 text-dalseo-muted">{body}</p>
    </article>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 text-sm">
      <div className="mt-1 text-dalseo-accent">{icon}</div>
      <div className="min-w-0">
        <div className="font-extrabold text-dalseo-ink">{label}</div>
        <div className="mt-1 break-words leading-6 text-dalseo-muted">{value}</div>
      </div>
    </div>
  );
}

function getTopImpacts(items: ImpactItem[]) {
  const counts = new Map<string, number>();

  for (const item of items) {
    for (const impact of item.impacts) {
      counts.set(impact, (counts.get(impact) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([impact]) => impact);
}

function formatPeriod(startsAt: string | null, endsAt: string | null) {
  if (!startsAt && !endsAt) {
    return "상시 또는 일정 미정";
  }

  if (startsAt && endsAt) {
    return `${startsAt} ~ ${endsAt}`;
  }

  return startsAt ? `${startsAt} 시작` : `${endsAt} 종료`;
}

function matchesCategoryFilter(item: ImpactItem, filter: FilterKey) {
  if (filter === "all") {
    return true;
  }

  if (filter === "opinion") {
    return Boolean(item.opinion_due_at);
  }

  return item.category === filter;
}

function urgencyClassName(urgency?: string) {
  const base = "rounded-dalseo px-2 py-1 text-xs font-bold";

  if (urgency === "마감 임박" || urgency === "긴급") {
    return `${base} bg-red-50 text-red-700`;
  }

  if (urgency === "확인 필요") {
    return `${base} bg-amber-50 text-amber-800`;
  }

  if (urgency === "계절 확인") {
    return `${base} bg-sky-50 text-sky-800`;
  }

  return `${base} bg-dalseo-soft text-dalseo-muted`;
}

type AIChatChoice =
  | {
      message?: {
        content?: string;
      };
      delta?: {
        content?: string;
      };
    }
  | {
      message?: null;
      delta?: null;
      [key: string]: unknown;
    };

type AIChatResponse = {
  choices?: AIChatChoice[];
};

function extractAiText(response: AIChatResponse) {
  const raw = response.choices?.map((choice) => choice.message?.content ?? choice.delta?.content).join("");
  return raw?.trim() || null;
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function extractCoachPayloadText(value: string) {
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return value.slice(start, end + 1).trim();
  }

  return value.trim();
}

function parseCoachPayload(value: string, fallback: CoachOutput) {
  const jsonText = extractCoachPayloadText(value);
  const parsed = safeJsonParse(jsonText);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  const payload = parsed as Record<string, unknown>;
  const headline = coerceText(payload.headline);
  const priority = coerceText(payload.priority);
  const reason = coerceText(payload.reason);
  const actions = coerceTextList(payload.actions);
  const watchouts = coerceTextList(payload.watchouts);

  const normalized: CoachOutput = {
    headline: headline ?? fallback.headline,
    priority: priority ?? fallback.priority,
    reason: reason ?? fallback.reason,
    actions: mergeWithFallbackList(actions, fallback.actions, 3, "권장 행동"),
    watchouts: mergeWithFallbackList(watchouts, fallback.watchouts, 2, "유의점"),
  };

  if (!headline || !priority || !reason) {
    return normalized;
  }

  if (normalized.actions.length < 3 || normalized.watchouts.length < 2) {
    return normalized;
  }

  return normalized;
}

function coerceText(value: unknown) {
  return typeof value === "string" ? value.trim() : null;
}

function coerceTextList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const compacted = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : null))
    .filter((entry): entry is string => Boolean(entry))
    .filter((entry, index, list) => list.indexOf(entry) === index)
    .slice(0, 6);

  return compacted;
}

function mergeWithFallbackList(
  candidate: string[],
  fallback: string[],
  targetLength: number,
  label: string,
) {
  const result = [...candidate];

  for (const item of fallback) {
    if (result.length >= targetLength) {
      break;
    }
    if (typeof item === "string" && item.trim()) {
      result.push(item);
    }
  }

  if (result.length === 0) {
    return [`${label}: 정보를 다시 확인하세요.`];
  }

  return result.slice(0, targetLength);
}

function movementModePrompt(profileKey: LifeProfileKey) {
  if (profileKey === "resident") {
    return {
      mode: "도보 중심 + 대중교통 병행",
      hint: "생활반경 동선(귀가/통학/외출), 보행 동선 안전성, 대중교통 정류장 접근성",
    };
  }

  if (profileKey === "driver") {
    return {
      mode: "차량 이동 중심",
      hint: "진입로·정체·우회로·임시통제 구간·주차 가능성 확보를 먼저 점검",
    };
  }

  if (profileKey === "transit") {
    return {
      mode: "대중교통 우선",
      hint: "정류장 접근성, 환승 시간, 대체 보행거리 증가를 중심으로 우선순위 판단",
    };
  }

  if (profileKey === "business") {
    return {
      mode: "고객 접근성 우선",
      hint: "가드레일, 진입 동선, 유동인구 유입·유출에 미치는 영향 중심으로 판단",
    };
  }

  if (profileKey === "childcare") {
    return {
      mode: "보행+돌봄 동선 우선",
      hint: "등하교·돌봄 이동 동선의 편의성, 통학 시간대 변화, 안전 조치 여부",
    };
  }

  return {
    mode: "저동력 이동성 우선",
    hint: "복지 접근, 보행 구간 부담, 교통약자 동선 변화를 병행 점검",
  };
}

function movementHint(item: ImpactItem) {
  if (typeof item.distance_m !== "number") {
    return "거리 정보 부족";
  }

  if (item.distance_m <= 300) {
    return "도보 5분 내외 도달 구간";
  }

  if (item.distance_m <= 800) {
    return "도보 이동 구간(약 10분) 영향 가능";
  }

  if (item.distance_m <= 1500) {
    return "도보 부담 증가, 대중교통/차량 연계 고려";
  }

  return "대부분 차량 이동·대중교통 연계 필요";
}

function sourceTypeLabel(sourceType?: string) {
  const labels: Record<string, string> = {
    official_html: "공식 웹",
    public_data_metadata: "공공데이터",
    openapi_metadata: "공공 API",
    standard_data_metadata: "표준데이터",
    normalized_reference: "정규화",
  };

  return sourceType ? labels[sourceType] ?? sourceType : "미상";
}

function formatDateTime(value?: string) {
  if (!value) {
    return "미상";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function createInitialResponse(query: string, radiusM: number): ImpactSearchResponse {
  const center = resolveAddress(query);
  const items = withDistanceAndScore(sampleImpactItems, center, radiusM);

  return {
    query,
    center,
    radius_m: radiusM,
    generated_at: "2026-06-28T00:00:00.000Z",
    source: "sample",
    items,
    insight: buildInsight(items),
  };
}
