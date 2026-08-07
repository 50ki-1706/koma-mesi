// 推薦ドメインで使用する有限の値を一元管理する。
// DB スキーマとアプリケーションの双方が同じ値集合を参照する。

/** 推薦バッチが取り得る処理状態。 */
export const RECOMMENDATION_BATCH_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;

/** 推薦バッチの処理状態。 */
export type RecommendationBatchStatus =
  (typeof RECOMMENDATION_BATCH_STATUSES)[number];

/** ホットペッパーグルメの大カテゴリ。 */
export const HOTPEPPER_GENRES = [
  "居酒屋",
  "ダイニングバー・バル",
  "創作料理",
  "和食",
  "洋食",
  "イタリアン・フレンチ",
  "中華",
  "焼肉・ホルモン",
  "韓国料理",
  "アジア・エスニック料理",
  "各国料理",
  "カラオケ・パーティ",
  "バー・カクテル",
  "ラーメン",
  "お好み焼き・もんじゃ",
  "カフェ・スイーツ",
  "その他グルメ",
] as const;

/** ホットペッパーグルメの大カテゴリ。 */
export type HotpepperGenre = (typeof HOTPEPPER_GENRES)[number];

/** 大学から店舗までの距離グループ。 */
export const DISTANCE_GROUPS = ["near", "middle", "far"] as const;

/** 大学から店舗までの距離グループ。 */
export type DistanceGroup = (typeof DISTANCE_GROUPS)[number];
