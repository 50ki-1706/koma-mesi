/**
 * ジャンルごとのおすすめ飲食店の一覧画面を表示する。
 * データ取得・スワイプ・ボトムシートの状態はカスタムフックに委譲する。
 */

"use client";

import { RecommendationCarousel } from "@/app/recommendations/RecommendationCarousel";
import { useRecommendations } from "@/hooks/useRecommendations";
import { BottomSheet } from "@/shared/components/BottomSheet/BottomSheet";

/**
 * おすすめ飲食店の一覧画面を表示する。
 *
 * @returns 読み込み中・エラー・空・一覧のいずれかの状態に応じた画面。
 */
export function RecommendationsScreen() {
  const {
    isLoading,
    errorMessage,
    items,
    currentIndex,
    currentItem,
    isBottomSheetOpen,
    handleSwipeNext,
    handleSwipePrevious,
    openBottomSheet,
    closeBottomSheet,
  } = useRecommendations();

  if (isLoading) {
    return (
      <main
        className="grid h-dvh place-items-center bg-background"
        aria-busy="true"
      >
        <output
          className="block size-9 animate-spin rounded-full border-4 border-brand-soft border-t-brand"
          aria-label="おすすめのお店を読み込んでいます"
        />
      </main>
    );
  }

  if (errorMessage !== null) {
    return (
      <main className="grid h-dvh place-items-center bg-background p-6 text-center text-ink">
        <p className="text-sm font-bold text-ink-muted">{errorMessage}</p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="grid h-dvh place-items-center bg-background p-6 text-center text-ink">
        <p className="text-sm font-bold text-ink-muted">
          まだおすすめのお店がありません。
        </p>
      </main>
    );
  }

  return (
    <main
      className="relative flex h-dvh flex-col overflow-hidden bg-background p-4 text-ink sm:p-6"
      aria-label="おすすめの飲食店"
    >
      <header className="shrink-0 pb-3">
        <p className="text-[0.65rem] font-black tracking-[0.22em] text-brand-hover">
          RECOMMEND
        </p>
        <h1 className="text-xl font-black tracking-tight sm:text-2xl">
          今日のおすすめ
        </h1>
      </header>

      <RecommendationCarousel
        currentIndex={currentIndex}
        items={items}
        onSelectCard={openBottomSheet}
        onSwipeNext={handleSwipeNext}
        onSwipePrevious={handleSwipePrevious}
      />

      <BottomSheet
        isOpen={isBottomSheetOpen}
        title={currentItem?.recommendation.name}
        onClose={closeBottomSheet}
      >
        {currentItem !== null ? (
          <a
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-black text-ink shadow-[0_8px_20px_oklch(0.65_0.15_75/0.22)] transition hover:bg-brand-hover hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:scale-[0.99]"
            href={currentItem.recommendation.platformUrl}
            rel="noreferrer"
            target="_blank"
          >
            グルメサイトで見る
          </a>
        ) : null}
      </BottomSheet>
    </main>
  );
}
