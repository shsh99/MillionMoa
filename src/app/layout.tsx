import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MillionMoa",
  description: "월급으로 1억까지, 가장 빠른 설계",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="font-pretendard">{children}</body>
    </html>
  );
}
