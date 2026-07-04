"use client";

import { Info, Map, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/impact", label: "주소 영향", icon: Map },
  { href: "/about", label: "서비스 설명", icon: Info },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-dalseo-border bg-dalseo-bg">
      <div className="mx-auto flex min-h-16 w-full max-w-[1440px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3 text-dalseo-ink no-underline">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-dalseo bg-dalseo-accent-strong text-white">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-extrabold">
              달서 AI 내 주소 영향 요약
            </span>
            <span className="mt-0.5 block truncate text-xs font-medium text-dalseo-muted">주소 주변 변화 확인</span>
          </span>
        </Link>

        <nav aria-label="주요 페이지" className="flex flex-wrap gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? "nav-link-active" : ""}`}
              >
                <Icon aria-hidden="true" className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
