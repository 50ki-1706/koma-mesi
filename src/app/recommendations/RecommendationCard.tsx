/**
 * カテゴリ1件分のおすすめ店をカード形式で表示する。
 * 店舗写真は取得していないため、カテゴリ名を表示するプレースホルダーを使う。
 */

"use client";

import type { FeaturedRecommendation } from "@/hooks/useRecommendations";

interface RecommendationCardProps {
  item: FeaturedRecommendation;
  onSelect: () => void;
}

/**
 * おすすめ店1件のカードを表示する。
 *
 * @param props - 表示する店の情報と選択操作。
 * @returns カテゴリ名のプレースホルダーと店名を表示する店舗カード。 */
export function RecommendationCard({
  item,
  onSelect,
}: RecommendationCardProps) {
  const { category, restaurant } = item;

  return (
    <article className="group relative h-full min-h-80 w-full overflow-hidden rounded-[2rem] border border-line/80 bg-surface text-left shadow-recommendation transition duration-300 hover:-translate-y-0.5 hover:shadow-recommendation-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:scale-[0.99] sm:min-h-96">
      <div
        className="absolute inset-0 grid place-items-center bg-brand-soft transition group-hover:scale-[1.02]"
        aria-hidden="true"
      >
        <span className="px-6 text-center text-2xl font-black tracking-tight text-brand-hover sm:text-3xl">
          {category.name}
        </span>
      </div>
      <button
        className="absolute inset-0 z-[1] lg:hidden"
        type="button"
        aria-label={`${restaurant.name}の詳細を開く`}
        onClick={onSelect}
      />
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-photo-overlay to-photo-overlay/0 px-6 pt-20 pb-6">
        <p className="text-xs font-bold tracking-wide text-surface/80">
          {category.name}
        </p>
        <h2 className="text-xl font-black tracking-tight text-surface drop-shadow-sm sm:text-2xl">
          {restaurant.name}
        </h2>
      </div>
    </article>
  );
}
