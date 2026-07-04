import { ArrowRight, Database, MapPin, Radio, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";

export default async function AboutPage() {
  return (
    <main className="min-h-[100dvh] bg-dalseo-bg text-dalseo-ink">
      <AppHeader />

      <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
        <section
          className="surface overflow-hidden bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(248,251,255,.98) 0%, rgba(248,251,255,.9) 43%, rgba(248,251,255,.44) 100%), url('/images/about-banner.png')",
          }}
        >
          <div className="grid min-h-[420px] items-center gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div>
              <p className="text-sm font-semibold text-dalseo-accent">서비스 설명</p>
              <h1 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight text-balance sm:text-4xl">
                공공 문서를 주민 생활 언어로 다시 정리하는 주소 기반 도구
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-dalseo-muted">
                달서 AI 내 주소 영향 요약은 달서구 주민이 주소를 입력하면 반경 내 행정,
                교통, 안전, 복지, 환경 이슈를 지도에서 확인하고, 쉬운말 요약과 생활유형별
                행동 가이드로 다음 판단을 돕는 서비스입니다.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/" className="primary-button">
                  처음으로
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
                <Link href="/impact" className="secondary-button min-h-11 px-4 text-sm">
                  주소 영향 보기
                </Link>
              </div>
            </div>

            <div className="grid gap-3 rounded-dalseo border border-dalseo-border bg-white/92 p-4 shadow-[var(--shadow)]">
              <HeroPoint
                icon={<MapPin className="size-5" />}
                title="주소 중심"
                body="입력한 생활권 주변 이슈를 먼저 정렬합니다."
              />
              <HeroPoint
                icon={<Database className="size-5" />}
                title="Supabase 우선"
                body="DB 데이터가 없으면 로컬 검증 데이터로 자동 전환합니다."
              />
              <HeroPoint
                icon={<Radio className="size-5" />}
                title="실시간 보강"
                body="대구 돌발 교통정보와 구간소통정보를 결과에 함께 병합합니다."
              />
              <HeroPoint
                icon={<ShieldCheck className="size-5" />}
                title="원문 확인"
                body="요약 후 필요한 항목만 담당 부서까지 확인합니다."
              />
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="surface p-5">
            <h2 className="text-lg font-semibold">이렇게 사용하세요</h2>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-dalseo-muted">
              <li>1. 주소를 입력하거나 지도에서 위치를 누릅니다.</li>
              <li>2. 지도 위 반경과 생활 유형을 바꿔 우선순위를 조정합니다.</li>
              <li>3. 생활영향 코치의 추천 행동을 본 뒤 원문과 담당 부서를 확인합니다.</li>
            </ol>
          </div>

          <div className="surface p-5">
            <h2 className="text-lg font-semibold">현재 연결된 데이터</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-dalseo-muted">
              <li>Supabase `impact_items`, `sources` 테이블을 우선 조회합니다.</li>
              <li>대구광역시 돌발 교통정보와 구간소통정보 API를 실시간 보강 데이터로 사용합니다.</li>
              <li>달서구 교통 데이터 API는 승인 상태가 맞으면 정기 동기화 대상으로 확장합니다.</li>
            </ul>
          </div>
        </section>

        <section className="mt-4 surface p-5">
          <h2 className="text-lg font-semibold">서비스 범위와 한계</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Reason
              title="생성형 AI"
              body="현재 화면의 코치는 규칙 기반 분석입니다. OpenAI API 연동 후 채팅과 리포트로 확장합니다."
            />
            <Reason
              title="주소 정확도"
              body="전체 도로명주소 지오코딩 전까지는 등록된 주요 장소와 지도 선택 위치를 우선 사용합니다."
            />
            <Reason
              title="최종 근거"
              body="요약은 참고 정보이며 실제 일정, 위치, 제출 방법은 원문과 담당 부서 확인이 필요합니다."
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function HeroPoint({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-dalseo bg-dalseo-soft p-4">
      <div className="text-dalseo-accent">{icon}</div>
      <h2 className="mt-2 text-base font-semibold">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-dalseo-muted">{body}</p>
    </article>
  );
}

function Reason({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-dalseo bg-dalseo-soft p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-dalseo-muted">{body}</p>
    </div>
  );
}
