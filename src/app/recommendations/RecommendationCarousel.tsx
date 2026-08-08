/**
 * 現在のジャンルのカードを表示し、左右スワイプでのジャンル切り替えを検知する。
 * 表示中のジャンルはドットインジケーターで示す。
 */

"use client";

import type { PointerEvent } from "react";
import { useRef } from "react";
import { RecommendationCard } from "@/app/recommendations/RecommendationCard";
import { SWIPE_THRESHOLD_PX } from "@/constants/gestures";
import type { FeaturedRecommendation } from "@/hooks/useRecommendations";

interface RecommendationCarouselProps {
  items: FeaturedRecommendation[];
  currentIndex: number;
  onSwipeNext: () => void;
  onSwipePrevious: () => void;
  onSelectCard: () => void;
}

interface EdgeNavigationButtonProps {
  direction: "previous" | "next";
  onNavigate: () => void;
}

/**
 * カード端に、前後の店舗へ移動するタップ領域を表示する。
 *
 * @param props - 移動方向と実行する操作。
 * @returns カード端のナビゲーションボタン。
 */
function EdgeNavigationButton({
  direction,
  onNavigate,
}: EdgeNavigationButtonProps) {
  const isPrevious = direction === "previous";

  return (
    <button
      className={`absolute inset-y-0 z-10 flex w-16 items-center px-3 text-surface opacity-80 transition hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-focus sm:w-20 ${
        isPrevious
          ? "left-0 justify-start bg-[linear-gradient(to_right,oklch(0.16_0.025_60/0.32),transparent)]"
          : "right-0 justify-end bg-[linear-gradient(to_left,oklch(0.16_0.025_60/0.32),transparent)]"
      }`}
      type="button"
      aria-label={isPrevious ? "前の店舗を表示" : "次の店舗を表示"}
      onClick={(event) => {
        event.stopPropagation();
        onNavigate();
      }}
    >
      <svg
        className={`size-7 fill-none stroke-current stroke-[2.5] drop-shadow-md ${
          isPrevious ? "" : "rotate-180"
        }`}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="m15 5-7 7 7 7" />
      </svg>
    </button>
  );
}

/**
 * スワイプ可能なジャンルカルーセルを表示する。
 *
 * @param props - 表示対象一覧、現在位置、スワイプ・選択操作。
 * @returns 現在のジャンルのカードとドットインジケーター。
 */
export function RecommendationCarousel({
  items,
  currentIndex,
  onSwipeNext,
  onSwipePrevious,
  onSelectCard,
}: RecommendationCarouselProps) {
  const startXRef = useRef<number | null>(null);
  const didSwipeRef = useRef(false);
  const currentItem = items[currentIndex];

  /**
   * スワイプの起点座標を記録する。
   *
   * @param event - ポインター押下イベント。
   * @returns なし。
   */
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    startXRef.current = event.clientX;
    didSwipeRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  /**
   * スワイプの移動距離から次/前のジャンルへ切り替える。
   *
   * @param event - ポインター解放イベント。
   * @returns なし。
   */
  const handlePointerUp = (event: PointerEvent<HTMLDivElement>): void => {
    const startX = startXRef.current;
    startXRef.current = null;
    if (startX === null) {
      return;
    }

    const deltaX = event.clientX - startX;
    if (deltaX >= SWIPE_THRESHOLD_PX) {
      didSwipeRef.current = true;
      onSwipePrevious();
    } else if (deltaX <= -SWIPE_THRESHOLD_PX) {
      didSwipeRef.current = true;
      onSwipeNext();
    }
  };

  /**
   * ポインター操作が中断された場合にスワイプの起点をリセットする。
   *
   * @returns なし。
   */
  const handlePointerCancel = (): void => {
    startXRef.current = null;
  };

  /**
   * カード選択を処理する。直前の操作がスワイプだった場合は無視する。
   * スワイプ後にブラウザが発火するclickでボトムシートが誤って開くのを防ぐ。
   *
   * @returns なし。
   */
  const handleSelectCard = (): void => {
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }
    onSelectCard();
  };

  if (currentItem === undefined) {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="relative min-h-0 flex-1 touch-pan-y select-none"
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <RecommendationCard
          key={currentItem.recommendation.id}
          item={currentItem}
          onSelect={handleSelectCard}
        />
        <EdgeNavigationButton
          direction="previous"
          onNavigate={onSwipePrevious}
        />
        <EdgeNavigationButton direction="next" onNavigate={onSwipeNext} />
      </div>
            <div className="mt-4 hidden shrink-0 grid-cols-2 gap-3 lg:grid">
        <div className="rounded-2xl bg-brand-soft p-4">
          <p className="mb-1 text-[0.65rem] font-black tracking-[0.12em] text-brand-hover">
            WALK
          </p>
          <p className="font-black text-ink">
            {currentItem.recommendation.durationMinutes}分
            <span className="ml-2 text-xs font-medium text-ink-muted">
              大学から {currentItem.recommendation.distanceMeters}m
            </span>
          </p>
        </div>
        <div className="rounded-2xl bg-surface-muted p-4">
          <p className="mb-1 text-[0.65rem] font-black tracking-[0.12em] text-ink-muted">
            BUDGET
          </p>
          <p className="font-black text-ink">
            約 ¥{currentItem.recommendation.priceYen.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="mt-4 flex shrink-0 items-center justify-center gap-1.5">
        {items.map((item, index) => (
          <span
            key={item.genre.id}
            className={`h-1.5 rounded-full transition-all ${
              index === currentIndex ? "w-6 bg-brand" : "w-1.5 bg-line"
            }`}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}
