import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "달서 AI 내 주소 영향 요약",
  description: "달서구 행정정보를 주소 기준 생활영향으로 요약하는 MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
