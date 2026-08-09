/**
 * 飲食店レコメンドページのデータ取得と表示状態を管理する。
 * ジャンルの切り替えと、ボトムシート・モバイル地図の表示状態を提供する。
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { orpc } from "@/lib/orpc/client";
import type { GetRecommendationsOutput } from "@/shared/recommendations/schemas";

/** 店舗の料金レンジ。未取得の場合はnull。 */
export type RecommendationPriceRange =
  NonNullable<GetRecommendationsOutput>["categories"][number]["recommendations"][number]["restaurant"]["priceRange"];

/**
 * カテゴリ1件につき、大学から最も近い（near）店舗のみを表示対象とする。
 * middle・farの店舗選択UIは未実装のため、いったんnearのみを扱う。
 */
export interface FeaturedRecommendation {
  category: {
    id: string;
    name: string;
  };
  restaurant: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    distanceMeters: number;
    campusToRestaurantSeconds: number;
    priceRange: RecommendationPriceRange;
  };
}

/**
 * 保存済み推薦のうち、カテゴリごとにnearの店舗だけを表示用データへ変換する。
 *
 * @param output - 推薦取得APIのレスポンス。
 * @returns カテゴリごとに1件（near）を並べた表示用データ。
 */
function toFeaturedRecommendations(
  output: GetRecommendationsOutput,
): FeaturedRecommendation[] {
  if (output === null) {
    return [];
  }

  return output.categories.flatMap((category) => {
    const near = category.recommendations.find(
      (recommendation) => recommendation.distanceGroup === "near",
    );
    if (near === undefined) {
      return [];
    }

    return [
      {
        category: { id: category.id, name: category.category },
        restaurant: {
          id: near.restaurant.id,
          name: near.restaurant.name,
          address: near.restaurant.address,
          latitude: near.restaurant.latitude,
          longitude: near.restaurant.longitude,
          distanceMeters: near.distanceMeters,
          campusToRestaurantSeconds: near.campusToRestaurantSeconds,
          priceRange: near.restaurant.priceRange,
        },
      },
    ];
  });
}

/**
 * 店舗の料金レンジを表示用の文字列へ整形する。
 *
 * @param priceRange - 店舗の料金レンジ。未取得の場合はnull。
 * @returns 表示用の料金文字列。
 */
export function formatPriceRange(priceRange: RecommendationPriceRange): string {
  if (priceRange === null) {
    return "価格情報なし";
  }

  const start = `¥${priceRange.startPrice.toLocaleString()}`;
  if (priceRange.endPrice === null) {
    return `${start}〜`;
  }

  return `${start}〜¥${priceRange.endPrice.toLocaleString()}`;
}

/**
 * おすすめ画面の表示状態と操作を提供する。
 */
export interface RecommendationsController {
  isLoading: boolean;
  errorMessage: string | null;
  items: FeaturedRecommendation[];
  currentIndex: number;
  currentItem: FeaturedRecommendation | null;
  isBottomSheetOpen: boolean;
  /** モバイル viewport で地図ビューを表示しているか。 */
  isMobileMapVisible: boolean;
  isGenerating: boolean;
  handleSwipeNext: () => void;
  handleSwipePrevious: () => void;
  openBottomSheet: () => void;
  closeBottomSheet: () => void;
  showMobileMap: () => void;
  hideMobileMap: () => void;
  handleGenerate: () => void;
}

/**
 * ジャンルごとのおすすめ店データを取得し、表示状態を返す。
 *
 * @returns 取得結果、現在位置、ボトムシートとモバイル地図の表示操作。 */
export function useRecommendations(): RecommendationsController {
  const [items, setItems] = useState<FeaturedRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isMobileMapVisible, setIsMobileMapVisible] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * ログインユーザーの保存済み推薦をDBから取得する。
   *
   * @returns 取得処理が完了したときに解決するPromise。
   */
  const fetchRecommendations = useCallback(async (): Promise<void> => {
    try {
      const result = await orpc.recommendation.getDaily({});
      setItems(toFeaturedRecommendations(result));
      setErrorMessage(null);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
      setErrorMessage("おすすめのお店を取得できませんでした。");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRecommendations();
  }, [fetchRecommendations]);

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

  /**
   * ボトムシートを閉じ、店舗カードの位置にモバイル用地図を表示する。
   *
   * @returns なし。
   */
  const showMobileMap = (): void => {
    setIsBottomSheetOpen(false);
    setIsMobileMapVisible(true);
  };

  /**
   * モバイル用地図を閉じ、店舗カードへ戻す。
   *
   * @returns なし。
   */
  const hideMobileMap = (): void => {
    setIsMobileMapVisible(false);
  };

  /**
   * 当日分の推薦を手動生成し、成功したら一覧を再取得する。
   * Cronの実行を待たずに動作確認できるようにするための操作。
   *
   * @returns なし。
   */
  const handleGenerate = (): void => {
    if (isGenerating) {
      return;
    }
    setIsGenerating(true);
    orpc.recommendation
      .generate({})
      .then(() => fetchRecommendations())
      .catch((error: unknown) => {
        console.error("Failed to generate recommendations:", error);
        setErrorMessage("おすすめを生成できませんでした。");
      })
      .finally(() => {
        setIsGenerating(false);
      });
  };

  return {
    isLoading,
    errorMessage,
    items,
    currentIndex,
    currentItem: items[currentIndex] ?? null,
    isBottomSheetOpen,
    isMobileMapVisible,
    isGenerating,
    handleSwipeNext,
    handleSwipePrevious,
    openBottomSheet,
    closeBottomSheet,
    showMobileMap,
    hideMobileMap,
    handleGenerate,
  };
}
