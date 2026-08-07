/**
 * 飲食店レコメンドページのデータ取得と表示状態を管理する。
 * ジャンルの切り替え（スワイプ）とボトムシートの開閉を提供する。
 */

"use client";

import { useEffect, useState } from "react";
import type { orpc } from "@/lib/orpc/client";

/** ジャンルごとのfeaturedな店1件を表す。 */
export type FeaturedRecommendation = Awaited<
  ReturnType<typeof orpc.recommendation.listFeaturedByGenre>
>[number];

// TODO: 表示確認用の一時的なデモデータ。DBにデータを投入したら削除し、
// 下のuseEffect内をorpc.recommendation.listFeaturedByGenre()の呼び出しに戻すこと。
const DEMO_ITEMS: FeaturedRecommendation[] = [
  {
    genre: { id: 1, name: "ラーメン", sortOrder: 1, createdAt: new Date() },
    recommendation: {
      id: 1,
      genreId: 1,
      name: "麺屋 大学前",
      address: "東京都新宿区西新宿1-2-3",
      distanceMeters: 450,
      durationMinutes: 6,
      photoUrl: "https://picsum.photos/seed/ramen/600/400",
      priceYen: 850,
      platformUrl: "https://example.com/ramen",
      isFeatured: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    genre: { id: 2, name: "カレー", sortOrder: 2, createdAt: new Date() },
    recommendation: {
      id: 2,
      genreId: 2,
      name: "スパイスカレー ことこと",
      address: "東京都新宿区西新宿2-4-1",
      distanceMeters: 320,
      durationMinutes: 4,
      photoUrl: "https://picsum.photos/seed/curry/600/400",
      priceYen: 780,
      platformUrl: "https://example.com/curry",
      isFeatured: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    genre: { id: 3, name: "定食", sortOrder: 3, createdAt: new Date() },
    recommendation: {
      id: 3,
      genreId: 3,
      name: "大衆食堂 みのり",
      address: "東京都新宿区西新宿3-1-8",
      distanceMeters: 600,
      durationMinutes: 8,
      photoUrl: "https://picsum.photos/seed/teishoku/600/400",
      priceYen: 950,
      platformUrl: "https://example.com/teishoku",
      isFeatured: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    genre: { id: 4, name: "カフェ", sortOrder: 4, createdAt: new Date() },
    recommendation: {
      id: 4,
      genreId: 4,
      name: "サンドイッチ&コーヒー Leaf",
      address: "東京都新宿区西新宿1-6-2",
      distanceMeters: 280,
      durationMinutes: 3,
      photoUrl: "https://picsum.photos/seed/cafe/600/400",
      priceYen: 690,
      platformUrl: "https://example.com/cafe",
      isFeatured: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
];

/** レコメンドページの表示状態と操作をまとめたコントローラー。 */
export interface RecommendationsController {
  isLoading: boolean;
  errorMessage: string | null;
  items: FeaturedRecommendation[];
  currentIndex: number;
  currentItem: FeaturedRecommendation | null;
  isBottomSheetOpen: boolean;
  handleSwipeNext: () => void;
  handleSwipePrevious: () => void;
  openBottomSheet: () => void;
  closeBottomSheet: () => void;
}

/**
 * ジャンルごとのおすすめ店データを取得し、表示状態を返す。
 *
 * @returns 取得結果、現在表示中のジャンルindex、ボトムシートの開閉操作。
 */
export function useRecommendations(): RecommendationsController {
  const [items, setItems] = useState<FeaturedRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  useEffect(() => {
    // TODO: 表示確認用の一時的なデモデータ表示。DB投入後は元に戻す:
    // const fetchRecommendations = async (): Promise<void> => {
    //   try {
    //     const result = await orpc.recommendation.listFeaturedByGenre();
    //     setItems(result);
    //   } catch {
    //     setErrorMessage("おすすめのお店を取得できませんでした。");
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    // void fetchRecommendations();
    setItems(DEMO_ITEMS);
    setErrorMessage(null);
    setIsLoading(false);
  }, []);

  /**
   * 次のジャンルへ表示を進める（末尾の次は先頭に戻る）。
   *
   * @returns なし。
   */
  const handleSwipeNext = (): void => {
    setCurrentIndex((index) => (index + 1) % items.length);
  };

  /**
   * 前のジャンルへ表示を戻す（先頭の前は末尾に戻る）。
   *
   * @returns なし。
   */
  const handleSwipePrevious = (): void => {
    setCurrentIndex((index) => (index - 1 + items.length) % items.length);
  };

  /**
   * 現在表示中の店のボトムシートを開く。
   *
   * @returns なし。
   */
  const openBottomSheet = (): void => {
    setIsBottomSheetOpen(true);
  };

  /**
   * ボトムシートを閉じる。
   *
   * @returns なし。
   */
  const closeBottomSheet = (): void => {
    setIsBottomSheetOpen(false);
  };

  return {
    isLoading,
    errorMessage,
    items,
    currentIndex,
    currentItem: items[currentIndex] ?? null,
    isBottomSheetOpen,
    handleSwipeNext,
    handleSwipePrevious,
    openBottomSheet,
    closeBottomSheet,
  };
}
