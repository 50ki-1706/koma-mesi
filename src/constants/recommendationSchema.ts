/**
 * 飲食店推薦スキーマで使用する列挙値を定義する。
 * DB制約とアプリケーションの型で同じ値集合を共有する。
 */

/** 推薦バッチが取りうる処理状態。 */
export const RECOMMENDATION_BATCH_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;

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

/** 大学から店舗までの距離グループ。 */
export const DISTANCE_GROUPS = ["near", "middle", "far"] as const;
