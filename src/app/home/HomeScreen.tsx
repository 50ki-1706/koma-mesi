/**
 * ホーム画面の表示を担当する。
 * 現段階では空の画面とログアウト操作だけを提供する。
 */

"use client";

import { useHome } from "@/hooks/useHome";

/**
 * ログアウトボタンを備えたホーム画面を表示する。
 *
 * @returns ホーム画面。
 */
export function HomeScreen() {
  const { handleSignOut } = useHome();

  return (
    <main
      className="relative h-dvh overflow-hidden bg-background"
      aria-label="ホーム"
    >
      <button
        className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-bold text-ink shadow-sm transition hover:border-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:scale-[0.98]"
        type="button"
        onClick={handleSignOut}
      >
        ログアウト
      </button>
    </main>
  );
}
