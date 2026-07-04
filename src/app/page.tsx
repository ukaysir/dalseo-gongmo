import { ArrowRight, Info, MapPin, Navigation, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";

export default function LandingPage() {
  return (
    <main className="min-h-[100dvh] bg-dalseo-bg text-dalseo-ink">
      <AppHeader />

      <section className="mx-auto grid min-h-[calc(100dvh-88px)] w-full max-w-[1180px] items-center gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-dalseo-accent">
            <ShieldCheck aria-hidden="true" className="size-4" />
            달서구 생활권 확인
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight text-pretty sm:text-5xl">
            내 주소 주변에서 바뀌는 일을 먼저 확인하세요
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-dalseo-muted">
            주소를 입력하거나 지도에서 위치를 찍으면 주변 행정 변화, 거리, 영향 범위, 담당
            정보를 한 화면에서 볼 수 있습니다.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/impact" className="primary-button">
              주소 영향 확인
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link href="/about" className="secondary-button min-h-11 px-4 text-sm">
              서비스 설명
              <Info aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>

        <div className="surface p-5">
          <div className="rounded-dalseo bg-dalseo-soft p-4">
            <MapPin aria-hidden="true" className="size-6 text-dalseo-accent" />
            <h2 className="mt-4 text-xl font-extrabold">주소로 보기</h2>
            <p className="mt-2 text-sm leading-6 text-dalseo-muted">
              내 집, 직장, 자주 가는 장소 기준으로 가까운 항목부터 정렬합니다.
            </p>
          </div>

          <div className="mt-3 rounded-dalseo bg-dalseo-soft p-4">
            <Navigation aria-hidden="true" className="size-6 text-dalseo-accent" />
            <h2 className="mt-4 text-xl font-extrabold">지도에서 찍기</h2>
            <p className="mt-2 text-sm leading-6 text-dalseo-muted">
              정확한 주소를 몰라도 지도에서 원하는 위치를 눌러 바로 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
