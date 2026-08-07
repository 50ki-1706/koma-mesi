// 推薦一覧APIがアプリケーション内で受け渡すデータモデルを定義する。
// DBの結合結果を画面が必要とする最小限の値へ限定する。

import type { DistanceGroup, HotpepperGenre } from "@/constants/recommendation";

/** 1店舗分の推薦一覧項目。 */
export interface DailyRecommendation {
  categoryId: string;
  category: HotpepperGenre;
  selectionOrder: number;
  recommendationId: string;
  distanceGroup: DistanceGroup;
  distanceMeters: number;
  displayOrder: number;
  restaurantId: string;
  googlePlaceId: string;
  restaurantName: string;
  restaurantAddress: string;
}
