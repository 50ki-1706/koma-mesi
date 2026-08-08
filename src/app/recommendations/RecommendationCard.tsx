/**
 * ジャンル1件分のおすすめ店をカード形式で表示する。
 * 店舗写真のスライドショーと店名を表示し、モバイルでは詳細を開けるようにする。 */

"use client";

import * as React from "react";
import { RECOMMENDATION_PHOTO_INTERVAL_MS } from "@/constants/recommendations";
import type { FeaturedRecommendation } from "@/hooks/useRecommendations";

interface RecommendationCardProps {
  item: FeaturedRecommendation;
  onSelect: () => void;
}

/**
 * おすすめ店1件のカードを表示する。
 *
 * @param props - 表示する店の情報と選択操作。
 * @returns 写真を切り替えられる店舗カード。 */
export function RecommendationCard({
  item,
  onSelect,
}: RecommendationCardProps) {
  const recommendation = item.recommendation;
  const [currentPhotoIndex, setCurrentPhotoIndex] = React.useState(0);
  const photos = recommendation.photoUrls;

  React.useEffect(() => {
    if (photos.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCurrentPhotoIndex((index) => (index + 1) % photos.length);
    }, RECOMMENDATION_PHOTO_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [photos.length]);


  return (
    <article
      className="group relative h-full min-h-80 w-full overflow-hidden rounded-[2rem] border border-line/80 bg-surface text-left shadow-[0_24px_80px_oklch(0.45_0.08_70/0.16)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_90px_oklch(0.45_0.08_70/0.2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:scale-[0.99] sm:min-h-96"
    >{photos.map((photo, index) => (
        // biome-ignore lint/performance/noImgElement: 外部の飲食店写真URLを表示するため next/image のドメイン許可設定を避ける
        <img
          className={`absolute inset-0 size-full object-cover transition-[opacity,transform] duration-1000 ease-in-out group-hover:scale-[1.02] ${
            index === currentPhotoIndex ? "opacity-100" : "opacity-0"
          }`}
          src={photo}
          alt={
            index === currentPhotoIndex
              ? `${recommendation.name}の写真 ${index + 1}枚目`
              : ""
          }
          aria-hidden={index !== currentPhotoIndex}
          draggable={false}
          key={photo}
        />
      ))}
      <button
        className="absolute inset-0 z-[1] lg:hidden"
        type="button"
        aria-label={`${recommendation.name}の詳細を開く`}
        onClick={onSelect}
        />
      <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,oklch(0.16_0.025_60/0.9),oklch(0.16_0.025_60/0))] px-6 pt-20 pb-6">
        <h2 className="text-xl font-black tracking-tight text-surface drop-shadow-sm sm:text-2xl">
          {recommendation.name}
        </h2>
                 {photos.length > 1 ? (
          <div
            className="mt-3 flex gap-1.5"
            aria-label={`${photos.length}枚中${currentPhotoIndex + 1}枚目`}
          >
            {photos.map((photo, index) => (
              <span
                className={`h-1.5 rounded-full transition-all ${
                  index === currentPhotoIndex
                    ? "w-6 bg-surface"
                    : "w-1.5 bg-surface/55"
                }`}
                key={photo}
              />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
