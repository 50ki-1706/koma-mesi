/**
 * ジャンルごとのおすすめ飲食店の一覧画面を表示する。
 * データ取得・スワイプ・ボトムシートの状態はカスタムフックに委譲する。
 */

"use client";
import Link from "next/link";
import { useMemo } from "react";

import { RecommendationCarousel } from "@/app/recommendations/RecommendationCarousel";
import { RecommendationMap } from "@/app/recommendations/RecommendationMap";
import { LG_BREAKPOINT_QUERY } from "@/constants/constants";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  formatPriceRange,
  useRecommendations,
} from "@/hooks/useRecommendations";
import { useUniversityLocation } from "@/hooks/useUniversityLocation";
import { BottomSheet } from "@/shared/components/BottomSheet/BottomSheet";
import { toWalkingMinutes } from "@/shared/recommendations/format";

/**
 * おすすめ飲食店の一覧画面を表示する。
 *
 * @returns 読み込み中・エラー・空・一覧のいずれかの状態に応じた画面。
 */
export function RecommendationsScreen() {
  const {
    isLoading,
    errorMessage,
    generationErrorMessage,
    items,
    currentIndex,
    currentItem,
    isBottomSheetOpen,
    isMobileMapVisible,
    isGenerating,
    generationPhase,
    handleSwipeNext,
    handleSwipePrevious,
    openBottomSheet,
    closeBottomSheet,
    showMobileMap,
    hideMobileMap,
    handleGenerate,
  } = useRecommendations();
  const {
    location: universityLocation,
    isLoading: isUniversityLocationLoading,
    hasError: hasUniversityLocationError,
  } = useUniversityLocation();
  const isDesktopViewport = useMediaQuery(LG_BREAKPOINT_QUERY);
  const destination = useMemo<google.maps.LatLngLiteral | null>(() => {
    if (currentItem === null) {
      return null;
    }
    return {
      lat: currentItem.restaurant.latitude,
      lng: currentItem.restaurant.longitude,
    };
  }, [
    currentItem,
    currentItem?.restaurant.latitude,
    currentItem?.restaurant.longitude,
  ]);

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
    if (generationErrorMessage !== null) {
      return (
        <main className="grid h-dvh place-items-center bg-background p-6 text-center text-ink">
          <div>
            <p className="mt-3 text-sm font-bold text-danger" role="alert">
              {generationErrorMessage}
            </p>
            <button
              className="mt-4 h-11 rounded-xl bg-brand px-6 text-sm font-black text-ink shadow-brand-action transition hover:bg-brand-hover hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? "生成しています…" : "再試行"}
            </button>
          </div>
        </main>
      );
    }

    if (generationPhase === "empty") {
      return (
        <main className="grid h-dvh place-items-center bg-background p-6 text-center text-ink">
          <p className="text-sm font-bold text-ink-muted">
            おすすめのお店が見つかりませんでした。
          </p>
        </main>
      );
    }

    return (
      <main
        className="grid h-dvh place-items-center bg-background p-6 text-center text-ink"
        aria-busy="true"
      >
        <div className="flex flex-col items-center gap-4">
          <svg
            className="h-8 w-8 animate-spin text-brand"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-sm font-bold text-ink-muted">
            {generationPhase === "refreshing"
              ? "おすすめを読み込んでいます…"
              : "おすすめを生成しています…"}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="relative flex h-dvh flex-col overflow-hidden bg-background p-4 pb-32 text-ink sm:p-6 sm:pb-32 lg:flex-row lg:gap-6 lg:pb-6"
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

        {generationErrorMessage !== null ? (
          <div
            className="mb-3 flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-line bg-surface-muted px-4 py-3 text-sm font-bold text-danger"
            role="alert"
          >
            <p>{generationErrorMessage}</p>
            <button
              className="shrink-0 rounded-xl bg-brand px-4 py-2 text-xs font-black text-ink shadow-brand-action transition hover:bg-brand-hover hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? "生成しています…" : "再試行"}
            </button>
          </div>
        ) : null}

        {isMobileMapVisible &&
        !isDesktopViewport &&
        destination !== null &&
        universityLocation !== null ? (
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-[2rem] border border-line/80 bg-surface shadow-recommendation">
            <RecommendationMap
              origin={universityLocation}
              destination={destination}
            />
            <button
              className="absolute inset-x-4 bottom-4 h-11 rounded-xl bg-surface/95 px-5 text-sm font-black text-ink shadow-floating-action backdrop-blur-sm transition hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:scale-[0.99]"
              type="button"
              onClick={hideMobileMap}
            >
              店舗カードに戻る
            </button>
          </div>
        ) : (
          <RecommendationCarousel
            currentIndex={currentIndex}
            items={items}
            onSelectCard={openBottomSheet}
            onSwipeNext={handleSwipeNext}
            onSwipePrevious={handleSwipePrevious}
          />
        )}
      </div>

      {destination !== null && isDesktopViewport ? (
        <div className="min-h-0 flex-1 pt-2">
          {universityLocation !== null ? (
            <RecommendationMap
              origin={universityLocation}
              destination={destination}
            />
          ) : (
            <div className="grid size-full place-items-center rounded-2xl border border-line bg-surface p-6 text-center text-sm font-bold text-ink-muted">
              {isUniversityLocationLoading
                ? "大学の位置を読み込んでいます。"
                : hasUniversityLocationError
                  ? "大学の位置を取得できませんでした。"
                  : "大学の位置が未設定です。"}
            </div>
          )}
        </div>
      ) : null}

      <div className="lg:hidden">
        <BottomSheet
          isOpen={isBottomSheetOpen}
          title={currentItem?.restaurant.name}
          onOpen={openBottomSheet}
          onClose={closeBottomSheet}
        >
          {currentItem !== null ? (
            <div>
              <div className="mb-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-brand-soft p-4">
                  <p className="mb-1 text-[0.65rem] font-black tracking-[0.12em] text-brand-hover">
                    WALK
                  </p>
                  <p className="text-lg font-black text-ink">
                    {toWalkingMinutes(
                      currentItem.restaurant.campusToRestaurantSeconds,
                    )}
                    分
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    大学から {currentItem.restaurant.distanceMeters}m
                  </p>
                </div>
                <div className="rounded-2xl bg-surface-muted p-4">
                  <p className="mb-1 text-[0.65rem] font-black tracking-[0.12em] text-ink-muted">
                    BUDGET
                  </p>
                  <p className="text-lg font-black text-ink">
                    {formatPriceRange(currentItem.restaurant.priceRange)}
                  </p>
                </div>
              </div>

              {universityLocation === null ? (
                <p className="mt-3 text-center text-xs font-bold text-ink-muted">
                  {isUniversityLocationLoading
                    ? "大学の位置を読み込んでいます。"
                    : hasUniversityLocationError
                      ? "大学の位置を取得できませんでした。"
                      : "大学の位置が未設定です。"}
                </p>
              ) : null}
              <button
                className="mt-3 flex h-11 w-full items-center justify-center rounded-xl border border-line bg-surface px-5 text-sm font-black text-ink transition hover:border-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                type="button"
                onClick={showMobileMap}
                disabled={universityLocation === null}
              >
                マップを表示する
              </button>
            </div>
          ) : null}
        </BottomSheet>
      </div>
    </main>
  );
}
