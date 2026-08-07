/**
 * 現在のジャンルのカードを表示し、左右スワイプでのジャンル切り替えを検知する。
 * 表示中のジャンルはドットインジケーターで示す。
 */

"use client";

import type { PointerEvent } from "react";
import { useRef } from "react";
import { RecommendationCard } from "@/app/recommendations/RecommendationCard";
import { SWIPE_THRESHOLD_PX } from "@/constants/recommendations";
import type { FeaturedRecommendation } from "@/hooks/useRecommendations";

interface RecommendationCarouselProps {
  items: FeaturedRecommendation[];
  currentIndex: number;
  onSwipeNext: () => void;
  onSwipePrevious: () => void;
  onSelectCard: () => void;
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
  const currentItem = items[currentIndex];

  /**
   * スワイプの起点座標を記録する。
   *
   * @param event - ポインター押下イベント。
   * @returns なし。
   */
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    startXRef.current = event.clientX;
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
      onSwipeNext();
    } else if (deltaX <= -SWIPE_THRESHOLD_PX) {
      onSwipePrevious();
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

  if (currentItem === undefined) {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="min-h-0 flex-1 touch-pan-y"
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <RecommendationCard item={currentItem} onSelect={onSelectCard} />
      </div>
      <div
        className="mt-4 flex shrink-0 items-center justify-center gap-1.5"
        aria-label="ジャンル"
        role="tablist"
      >
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
