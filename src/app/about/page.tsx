import { ArrowRight, Database, MapPin, ShieldCheck } from "lucide-react";
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
                교통, 안전, 복지, 환경 이슈를 지도에서 확인하고, 쉬운말 요약과 행동 가이드로
                다음 판단을 돕는 서비스입니다.
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
                title="출처 공개"
                body="공식 웹, 공공데이터, 원문 링크를 함께 보여줍니다."
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
              <li>2. 가까운 항목부터 확인합니다.</li>
              <li>3. 필요한 항목만 원문과 담당 부서를 확인합니다.</li>
            </ol>
          </div>

          <div className="surface p-5">
            <h2 className="text-lg font-semibold">명확한 한계</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-dalseo-muted">
              <li>실주소 지오코딩은 아직 제한적이며, 등록된 주요 장소를 우선 사용합니다.</li>
              <li>공공데이터 원자료는 인증키나 파일 다운로드 절차가 필요한 경우가 있습니다.</li>
              <li>요약은 참고 정보이며 최종 판단은 원문과 담당 부서 확인이 필요합니다.</li>
            </ul>
          </div>
        </section>

        <section className="mt-4 surface p-5">
          <h2 className="text-lg font-semibold">사용 흐름</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Reason
              title="주소 영향"
              body="주소 검색, 지도, 이슈 상세를 한 화면에서 처리하는 핵심 작업 공간입니다."
            />
            <Reason
              title="서비스 설명"
              body="서비스가 어떤 정보를 보여주고 어떤 한계가 있는지만 짧게 확인합니다."
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
