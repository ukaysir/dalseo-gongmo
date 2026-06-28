"use client";

import {
  AlertCircle,
  Bell,
  CalendarClock,
  ExternalLink,
  FileText,
  MapPin,
  Navigation,
  Search,
} from "lucide-react";
import dynamic from "next/dynamic";
import { FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { resolveAddress, withDistanceAndScore } from "@/lib/geo";
import { buildInsight } from "@/lib/insight";
import { addressCandidates } from "@/lib/sample-data";
import { sampleImpactItems } from "@/lib/sample-data";
import type { ImpactItem, ImpactSearchResponse } from "@/lib/types";

const categoryLabels: Record<ImpactItem["category"], string> = {
  traffic: "교통통제",
  construction: "공사",
  urban_plan: "도시계획",
  council: "의회",
  public_notice: "고시공고",
  event: "행사",
  safety: "안전",
  parking: "주차",
  heat: "무더위쉼터",
  facility: "공공시설",
  welfare: "복지",
  environment: "환경",
};

const radiusOptions = [500, 1000, 2000];
const ImpactMap = dynamic(() => import("@/components/ImpactMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] items-center justify-center border border-[#dfe4d6] bg-white text-sm text-[#69746d]">
      지도를 불러오는 중
    </div>
  ),
});

export default function Home() {
  const [address, setAddress] = useState("달서구청");
  const [radius, setRadius] = useState(1000);
  const [data, setData] = useState<ImpactSearchResponse | null>(() =>
    createInitialResponse("달서구청", 1000),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedItem = useMemo(() => {
    return data?.items.find((item) => item.id === selectedId) ?? data?.items[0];
  }, [data, selectedId]);

  async function loadImpacts(nextAddress = address, nextRadius = radius) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/impacts?address=${encodeURIComponent(nextAddress)}&radius=${nextRadius}`,
      );

      if (!response.ok) {
        throw new Error("생활영향 정보를 불러오지 못했습니다.");
      }

      const payload = (await response.json()) as ImpactSearchResponse;
      setData(payload);
      setSelectedId(payload.items[0]?.id ?? null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "알 수 없는 오류가 발생했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadImpacts();
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-[#1d241f]">
      <section className="border-b border-[#dfe4d6] bg-[#fbfcf8]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-[#3c6f5a]">
                달서구 시민 맞춤 공공서비스 MVP
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[#16201b] sm:text-4xl">
                내 주소에 영향을 주는 행정 변화를 쉬운 말로 확인
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#59645d]">
                고시공고, 도시계획, 교통통제, 회의록 데이터를 주소 기준으로
                묶어 소음·주차·통행·의견 제출 기한을 한 번에 요약합니다.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Metric
                label="데이터"
                value={data?.source === "local_file" ? "로컬" : "샘플"}
              />
              <Metric label="검색 반경" value={`${radius / 1000}km`} />
              <Metric label="관련 이슈" value={`${data?.items.length ?? 0}건`} />
            </div>
          </div>

          <form
            onSubmit={submitSearch}
            className="grid gap-3 border-y border-[#dfe4d6] py-5 lg:grid-cols-[1fr_auto_auto]"
          >
            <label className="relative block">
              <span className="sr-only">주소 또는 장소명</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#6f7a72]"
              />
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="예: 달서구청, 상인역, 두류공원"
                className="h-12 w-full border border-[#cfd7ca] bg-white pl-12 pr-4 text-base outline-none transition focus:border-[#3c6f5a] focus:ring-2 focus:ring-[#b8d8c9]"
              />
            </label>
            <div className="grid grid-cols-3 border border-[#cfd7ca] bg-white">
              {radiusOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setRadius(option);
                    void loadImpacts(address, option);
                  }}
                  className={`h-12 px-4 text-sm font-semibold transition ${
                    radius === option
                      ? "bg-[#214c3d] text-white"
                      : "text-[#4c5750] hover:bg-[#eef3ea]"
                  }`}
                >
                  {option >= 1000 ? `${option / 1000}km` : `${option}m`}
                </button>
              ))}
            </div>
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 bg-[#214c3d] px-6 text-sm font-semibold text-white transition hover:bg-[#17372d]"
            >
              <Navigation aria-hidden="true" className="size-4" />
              영향 분석
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {addressCandidates.map((candidate) => (
              <button
                key={candidate.label}
                type="button"
                onClick={() => {
                  setAddress(candidate.label);
                  void loadImpacts(candidate.label, radius);
                }}
                className="border border-[#cfd7ca] bg-white px-3 py-2 text-sm text-[#46524b] transition hover:border-[#3c6f5a] hover:text-[#214c3d]"
              >
                {candidate.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[390px_1fr] lg:px-8">
        <aside className="space-y-4">
          <div className="border border-[#dfe4d6] bg-white p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-1 size-5 text-[#a15c1b]" />
              <div>
                <h2 className="text-lg font-semibold">AI 생활영향 요약</h2>
                <p className="mt-2 text-sm leading-6 text-[#59645d]">
                  {data?.insight.headline ?? "주소를 기준으로 관련 이슈를 확인합니다."}
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {(data?.insight.bullets ?? []).map((bullet) => (
                <li key={bullet} className="text-sm leading-6 text-[#46524b]">
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-[#dfe4d6] bg-white p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Bell aria-hidden="true" className="size-5 text-[#3c6f5a]" />
              다음 행동
            </h2>
            <div className="mt-4 space-y-3">
              {(data?.insight.next_actions ?? []).map((action) => (
                <div
                  key={action}
                  className="border-l-4 border-[#b8d8c9] bg-[#f4f7f0] px-3 py-2 text-sm text-[#46524b]"
                >
                  {action}
                </div>
              ))}
            </div>
          </div>

          {error ? (
            <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </aside>

        <div className="space-y-6">
          {data ? (
            <ImpactMap
              center={data.center}
              items={data.items}
              radiusM={radius}
              selectedId={selectedItem?.id ?? null}
              onSelect={setSelectedId}
            />
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="min-w-0 border border-[#dfe4d6] bg-white">
            <div className="flex items-center justify-between border-b border-[#dfe4d6] p-5">
              <div>
                <h2 className="text-lg font-semibold">주소 주변 이슈</h2>
                <p className="mt-1 text-sm text-[#69746d]">
                  기준 위치: {data?.center.address ?? "분석 중"}
                </p>
              </div>
              <span className="text-sm text-[#69746d]">
                {isLoading ? "불러오는 중" : data?.generated_at ? "최신 분석" : "대기"}
              </span>
            </div>

            <div className="divide-y divide-[#edf0e8]">
              {data?.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`block w-full p-5 text-left transition ${
                    selectedItem?.id === item.id ? "bg-[#f4f7f0]" : "hover:bg-[#fafbf7]"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-[#e6efe8] px-2 py-1 text-xs font-semibold text-[#214c3d]">
                      {categoryLabels[item.category]}
                    </span>
                    <span className="text-xs text-[#69746d]">
                      {item.distance_m?.toLocaleString()}m
                    </span>
                    <span className="text-xs text-[#69746d]">
                      관련도 {item.relevance_score}점
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-[#1d241f]">
                    {item.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#59645d]">
                    {item.plain_summary}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.impacts.map((impact) => (
                      <span
                        key={impact}
                        className="border border-[#d7ddcf] px-2 py-1 text-xs text-[#59645d]"
                      >
                        {impact}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            {data?.items.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#69746d]">
                선택한 반경 안에 표시할 이슈가 없습니다.
              </div>
            ) : null}
          </section>

          <section className="border border-[#dfe4d6] bg-white">
            <div className="border-b border-[#dfe4d6] p-5">
              <h2 className="text-lg font-semibold">상세 요약</h2>
              <p className="mt-1 text-sm text-[#69746d]">
                원문 근거와 주민 행동을 함께 확인합니다.
              </p>
            </div>

            {selectedItem ? (
              <div className="space-y-5 p-5">
                <div>
                  <span className="bg-[#e9eddf] px-2 py-1 text-xs font-semibold text-[#4f5e26]">
                    {selectedItem.source_name}
                  </span>
                  <h3 className="mt-3 text-xl font-semibold leading-7">
                    {selectedItem.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#59645d]">
                    {selectedItem.plain_summary}
                  </p>
                </div>

                <InfoRow
                  icon={<MapPin className="size-4" />}
                  label="위치"
                  value={`${selectedItem.address} · ${selectedItem.distance_m?.toLocaleString()}m`}
                />
                <InfoRow
                  icon={<CalendarClock className="size-4" />}
                  label="기간"
                  value={formatPeriod(selectedItem.starts_at, selectedItem.ends_at)}
                />
                <InfoRow
                  icon={<FileText className="size-4" />}
                  label="의견 제출"
                  value={selectedItem.opinion_due_at ?? "해당 없음"}
                />

                <div className="border-t border-[#edf0e8] pt-5">
                  <h4 className="text-sm font-semibold">주민 행동 가이드</h4>
                  <p className="mt-2 text-sm leading-6 text-[#59645d]">
                    {selectedItem.action_guide}
                  </p>
                </div>

                <div className="border-t border-[#edf0e8] pt-5">
                  <h4 className="text-sm font-semibold">담당 부서</h4>
                  <p className="mt-2 text-sm text-[#59645d]">
                    {selectedItem.department} · {selectedItem.contact}
                  </p>
                </div>

                <a
                  href={selectedItem.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 bg-[#1d241f] px-4 text-sm font-semibold text-white transition hover:bg-[#343d36]"
                >
                  원문 출처 열기
                  <ExternalLink aria-hidden="true" className="size-4" />
                </a>
              </div>
            ) : (
              <div className="p-8 text-sm text-[#69746d]">상세 표시할 항목이 없습니다.</div>
            )}
          </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-24 border border-[#dfe4d6] bg-white px-4 py-3">
      <div className="text-xs font-semibold text-[#69746d]">{label}</div>
      <div className="mt-1 text-lg font-semibold text-[#16201b]">{value}</div>
    </div>
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
      <div className="mt-1 text-[#3c6f5a]">{icon}</div>
      <div>
        <div className="font-semibold text-[#1d241f]">{label}</div>
        <div className="mt-1 leading-6 text-[#59645d]">{value}</div>
      </div>
    </div>
  );
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
