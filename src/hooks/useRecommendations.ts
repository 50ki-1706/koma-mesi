/**
 * 飲食店レコメンドページのデータ取得と表示状態を管理する。
 * ジャンルの切り替え（スワイプ）とボトムシートの開閉を提供する。
 */

"use client";

import { useEffect, useState } from "react";
import { orpc } from "@/lib/orpc/client";

/** 日次推薦に含まれる店舗1件を表す。 */
export type DailyRecommendation = Awaited<
  ReturnType<typeof orpc.recommendation.listToday>
>[number];

/** レコメンドページの表示状態と操作をまとめたコントローラー。 */
export interface RecommendationsController {
  isLoading: boolean;
  errorMessage: string | null;
  items: DailyRecommendation[];
  currentIndex: number;
  currentItem: DailyRecommendation | null;
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
  const [items, setItems] = useState<DailyRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async (): Promise<void> => {
      try {
        const result = await orpc.recommendation.listToday();
        setItems(result);
      } catch {
        setErrorMessage("おすすめのお店を取得できませんでした。");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchRecommendations();
  }, []);

  /**
   * 次のジャンルへ表示を進める（末尾の次は先頭に戻る）。
   *
   * @returns なし。
   */
  const handleSwipeNext = (): void => {
    if (items.length === 0) {
      return;
    }
    setCurrentIndex((index) => (index + 1) % items.length);
  };

  /**
   * 前のジャンルへ表示を戻す（先頭の前は末尾に戻る）。
   *
   * @returns なし。
   */
  const handleSwipePrevious = (): void => {
    if (items.length === 0) {
      return;
    }
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
