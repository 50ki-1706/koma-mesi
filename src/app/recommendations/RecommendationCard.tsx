/**
 * ジャンル1件分のおすすめ店をカード形式で表示する。
 * タップでボトムシートを開く操作を親から受け取る。
 */

import {
  DISTANCE_GROUP_LABELS,
  WALKING_SPEED_METERS_PER_MINUTE,
} from "@/constants/recommendations";
import type { DailyRecommendation } from "@/hooks/useRecommendations";

interface RecommendationCardProps {
  item: DailyRecommendation;
  onSelect: () => void;
}

/**
 * おすすめ店1件のカードを表示する。
 *
 * @param props - 表示する店の情報と選択操作。
 * @returns 店名・距離・時間・金額を含むカード。
 */
export function RecommendationCard({
  item,
  onSelect,
}: RecommendationCardProps) {
  const walkingMinutes = Math.ceil(
    item.distanceMeters / WALKING_SPEED_METERS_PER_MINUTE,
  );

  return (
    <button
      className="relative flex h-full w-full flex-col overflow-hidden rounded-[1.75rem] border border-line/80 bg-surface/95 text-left shadow-[0_24px_80px_oklch(0.45_0.08_70/0.12)] transition active:scale-[0.99]"
      type="button"
      onClick={onSelect}
    >
      <div className="relative flex h-56 w-full items-end overflow-hidden bg-[radial-gradient(circle_at_top_right,oklch(0.9_0.08_75),transparent_55%),linear-gradient(145deg,oklch(0.97_0.02_75),oklch(0.91_0.04_75))] p-5 sm:h-64">
        <span className="absolute top-4 left-4 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-ink">
          {item.category}
        </span>
        <span className="text-xs font-black tracking-[0.16em] text-brand-hover">
          {DISTANCE_GROUP_LABELS[item.distanceGroup]}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 py-4">
        <h2 className="text-lg font-black tracking-tight text-ink">
          {item.restaurantName}
        </h2>
        <p className="text-xs text-ink-muted">{item.restaurantAddress}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-ink-muted">
          <span className="rounded-full bg-surface-muted/70 px-2.5 py-1">
            大学から {item.distanceMeters}m ・ 徒歩約{walkingMinutes}分
          </span>
        </div>
        <p className="mt-auto text-[0.65rem] font-bold text-brand-hover">
          タップして詳細を見る
        </p>
      </div>
    </button>
  );
}
