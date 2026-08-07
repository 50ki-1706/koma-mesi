/**
 * ジャンルごとのおすすめ飲食店の一覧画面を表示する。
 * データ取得・スワイプ・ボトムシートの状態はカスタムフックに委譲する。
 */

"use client";
import Link from "next/link";

import { RecommendationCarousel } from "@/app/recommendations/RecommendationCarousel";
import { RecommendationMap } from "@/app/recommendations/RecommendationMap";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useUniversityLocation } from "@/hooks/useUniversityLocation";
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
  const universityLocation = useUniversityLocation();

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
      className="relative flex h-dvh flex-col overflow-hidden bg-background p-4 text-ink sm:p-6 lg:flex-row lg:gap-6"
      aria-label="おすすめの飲食店"
    >
      <div className="flex min-h-0 flex-1 flex-col lg:max-w-md">
        <header className="flex shrink-0 items-center justify-between gap-4 pb-3">
          <div>
            <p className="text-[0.65rem] font-black tracking-[0.22em] text-brand-hover">
              RECOMMEND
            </p>
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">
              今日のおすすめ
            </h1>
          </div>
          <Link
            className="grid size-10 place-items-center rounded-full border border-line bg-surface text-ink-muted shadow-sm transition hover:border-brand hover:bg-brand-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            href="/account"
            aria-label="アカウントページを開く"
          >
            <svg
              className="size-5 fill-none stroke-current stroke-[1.8]"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20c.5-4 2.8-6 7-6s6.5 2 7 6" />
            </svg>
          </Link>
        </header>

        <RecommendationCarousel
          currentIndex={currentIndex}
          items={items}
          onSelectCard={openBottomSheet}
          onSwipeNext={handleSwipeNext}
          onSwipePrevious={handleSwipePrevious}
        />
      </div>

      {currentItem !== null ? (
        <div className="hidden min-h-0 flex-1 pt-2 lg:block">
          <RecommendationMap
            origin={universityLocation}
            destination={{
              lat: currentItem.recommendation.latitude,
              lng: currentItem.recommendation.longitude,
            }}
          />
        </div>
      ) : null}

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
