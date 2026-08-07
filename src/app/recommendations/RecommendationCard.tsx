/**
 * ジャンル1件分のおすすめ店をカード形式で表示する。
 * タップでボトムシートを開く操作を親から受け取る。
 */

import type { FeaturedRecommendation } from "@/hooks/useRecommendations";

interface RecommendationCardProps {
  item: FeaturedRecommendation;
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
  const { genre, recommendation } = item;

  return (
    <button
      className="relative flex h-full w-full flex-col overflow-hidden rounded-[1.75rem] border border-line/80 bg-surface/95 text-left shadow-[0_24px_80px_oklch(0.45_0.08_70/0.12)] transition active:scale-[0.99]"
      type="button"
      onClick={onSelect}
    >
      <span className="absolute top-4 left-4 z-10 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-ink">
        {genre.name}
      </span>
      {/* biome-ignore lint/performance/noImgElement: 外部の飲食店写真URLを表示するため next/image のドメイン許可設定を避ける */}
      <img
        className="h-56 w-full object-cover sm:h-64"
        src={recommendation.photoUrl}
        alt={recommendation.name}
        draggable={false}
      />
      <div className="flex flex-1 flex-col gap-2 px-5 py-4">
        <h2 className="text-lg font-black tracking-tight text-ink">
          {recommendation.name}
        </h2>
        <p className="text-xs text-ink-muted">{recommendation.address}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-ink-muted">
          <span className="rounded-full bg-surface-muted/70 px-2.5 py-1">
            大学から {recommendation.distanceMeters}m ・{" "}
            {recommendation.durationMinutes}分
          </span>
          <span className="rounded-full bg-surface-muted/70 px-2.5 py-1">
            ¥{recommendation.priceYen.toLocaleString()}
          </span>
        </div>
        <p className="mt-auto text-[0.65rem] font-bold text-brand-hover">
          タップして詳細を見る
        </p>
      </div>
    </button>
  );
}
