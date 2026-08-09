/**
 * 飲食店レコメンドページのデータ取得と表示状態を管理する。
 * 推薦生成フェーズ、ジャンルの切り替え、ボトムシート・モバイル地図の表示状態を提供する。
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { orpc } from "@/lib/orpc/client";
import type { GetRecommendationsOutput } from "@/shared/schema";

/** 店舗の料金レンジ。未取得の場合はnull。 */
export type RecommendationPriceRange =
  NonNullable<GetRecommendationsOutput>["categories"][number]["recommendations"][number]["restaurant"]["priceRange"];

/**
 * カテゴリ1件につき、near・middle・farからランダムに選んだ1店舗を表示対象とする。
 * 距離帯を選択するUIは未実装のため、取得のたびに抽選した1件だけを扱う。
 */
export interface FeaturedRecommendation {
  category: {
    id: string;
    name: string;
  };
  restaurant: {
    id: string;
    googlePlaceId: string;
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
 * 保存済み推薦のうち、カテゴリごとに距離帯をランダムに1件選び表示用データへ変換する。
 *
 * @param output - 推薦取得APIのレスポンス。
 * @returns カテゴリごとに1件（near・middle・farからランダム）を並べた表示用データ。
 */
function toFeaturedRecommendations(
  output: GetRecommendationsOutput,
): FeaturedRecommendation[] {
  if (output === null) {
    return [];
  }

  return output.categories.flatMap((category) => {
    const picked =
      category.recommendations[
        Math.floor(Math.random() * category.recommendations.length)
      ];
    if (picked === undefined) {
      return [];
    }

    return [
      {
        category: { id: category.id, name: category.category },
        restaurant: {
          id: picked.restaurant.id,
          googlePlaceId: picked.restaurant.googlePlaceId,
          name: picked.restaurant.name,
          address: picked.restaurant.address,
          latitude: picked.restaurant.latitude,
          longitude: picked.restaurant.longitude,
          distanceMeters: picked.distanceMeters,
          campusToRestaurantSeconds: picked.campusToRestaurantSeconds,
          priceRange: picked.restaurant.priceRange,
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

/** 推薦の自動生成フローの現在のフェーズ。 */
export type GenerationPhase = "idle" | "generating" | "refreshing" | "empty";

/**
 * おすすめ画面の表示状態と操作を提供する。
 */
export interface RecommendationsController {
  isLoading: boolean;
  /** 初回取得に失敗した場合のエラーメッセージ。 */
  errorMessage: string | null;
  /** 推薦生成に失敗した場合のエラーメッセージ。 */
  generationErrorMessage: string | null;
  items: FeaturedRecommendation[];
  currentIndex: number;
  currentItem: FeaturedRecommendation | null;
  isBottomSheetOpen: boolean;
  /** モバイル viewport で地図ビューを表示しているか。 */
  isMobileMapVisible: boolean;
  isGenerating: boolean;
  /** 推薦の自動生成フローの現在のフェーズ。 */
  generationPhase: GenerationPhase;
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
  const [generationErrorMessage, setGenerationErrorMessage] = useState<
    string | null
  >(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isMobileMapVisible, setIsMobileMapVisible] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] =
    useState<GenerationPhase>("idle");

  /**
   * ログインユーザーの保存済み推薦をDBから取得する。
   * 初回読み込み時はエラーをerrorMessageへ反映するが、生成直後の再取得（reportInitialError:
   * false）では失敗を握りつぶさず呼び出し元へ伝播し、generationErrorMessage側で扱わせる。
   *
   * @param options.reportInitialError - 失敗時にerrorMessageへ反映するか。既定はtrue。
   * @returns 取得処理が完了したときに解決するPromise。
   */
  const fetchRecommendations = useCallback(
    async ({ reportInitialError = true } = {}): Promise<void> => {
      try {
        const result = await orpc.recommendation.getDaily({});
        const newItems = toFeaturedRecommendations(result);
        setItems(newItems);
        setCurrentIndex((index) =>
          newItems.length === 0 ? 0 : Math.min(index, newItems.length - 1),
        );
        if (reportInitialError) {
          setErrorMessage(null);
        }
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
        if (reportInitialError) {
          setErrorMessage("おすすめのお店を取得できませんでした。");
        } else {
          throw error;
        }
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * 当日分の推薦を生成し、成功したら一覧を再取得する。
   * 初回の自動生成と、生成失敗時の再試行で使用する。
   *
   * @returns なし。
   */
  const handleGenerate = useCallback((): void => {
    if (isGenerating) return;
    setGenerationErrorMessage(null);
    setGenerationPhase("generating");
    setIsGenerating(true);
    orpc.recommendation
      .generate({})
      .then(() =>
        fetchRecommendations({ reportInitialError: false }).then(() => {
          setItems((currentItems) => {
            if (currentItems.length === 0) {
              setGenerationPhase("empty");
            }
            return currentItems;
          });
        }),
      )
      .catch((_error: unknown) => {
        setGenerationErrorMessage("おすすめを生成できませんでした。");
      })
      .finally(() => setIsGenerating(false));
  }, [isGenerating, fetchRecommendations]);

  useEffect(() => {
    void fetchRecommendations();
  }, [fetchRecommendations]);

  useEffect(() => {
    if (
      !isLoading &&
      !errorMessage &&
      items.length === 0 &&
      !isGenerating &&
      generationPhase === "idle"
    ) {
      setGenerationPhase("generating");
      handleGenerate();
    }
  }, [
    isLoading,
    errorMessage,
    items.length,
    isGenerating,
    generationPhase,
    handleGenerate,
  ]);

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

  return {
    isLoading,
    errorMessage,
    generationErrorMessage,
    items,
    currentIndex,
    currentItem: items[currentIndex] ?? null,
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
  };
}
