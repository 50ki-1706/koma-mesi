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
 * @returns 店舗写真と店名だけを重ねたカード。
 */
export function RecommendationCard({
  item,
  onSelect,
}: RecommendationCardProps) {
  const recommendation = item.recommendation;

  return (
    <button
      className="group relative h-full min-h-80 w-full overflow-hidden rounded-[2rem] border border-line/80 bg-surface text-left shadow-[0_24px_80px_oklch(0.45_0.08_70/0.16)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_90px_oklch(0.45_0.08_70/0.2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:scale-[0.99] sm:min-h-96"
      type="button"
      onClick={onSelect}
    >
      {/* biome-ignore lint/performance/noImgElement: 外部の飲食店写真URLを表示するため next/image のドメイン許可設定を避ける */}
      <img
        className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.02]"
        src={recommendation.photoUrl}
        alt={recommendation.name}
        draggable={false}
      />
      <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,oklch(0.16_0.025_60/0.9),oklch(0.16_0.025_60/0))] px-6 pt-20 pb-6">
        <h2 className="text-xl font-black tracking-tight text-surface drop-shadow-sm sm:text-2xl">
          {recommendation.name}
        </h2>
      </div>
    </button>
  );
}
