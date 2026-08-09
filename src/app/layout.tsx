import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** アプリケーション全体で使用するタイトル、説明、およびアイコン設定。 */
export const metadata: Metadata = {
  title: "コマメシ | 大学のランチをもっと楽しく",
  description: "大学の昼休みにぴったりのお店と出会えるランチサービスです。",
  icons: {
    icon: {
      url: "/komamesi.svg",
      type: "image/svg+xml",
    },
  },
};

/**
 * アプリケーション共通のルートレイアウトを表示する。
 *
 * @param props - ページとして描画する子要素。
 * @returns フォントと言語設定を適用したHTMLドキュメント。
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
