/**
 * 日次推薦生成で使用する検索条件とカテゴリ変換表を定義する。
 * ホットペッパー由来の昼食カテゴリをGoogle Placesの検索種別へ対応付ける。
 */

/** Nearby Searchで取得するカテゴリごとの最大候補数。 */
export const GOOGLE_NEARBY_SEARCH_MAX_RESULTS = 20;

/** 大学から店舗までに許容する徒歩経路距離（m）。 */
export const MAX_CAMPUS_TO_RESTAURANT_DISTANCE_METERS = 800;

/** 1回の推薦で採用するカテゴリ数。 */
export const RECOMMENDATION_CATEGORY_COUNT = 3;

/** 1カテゴリで採用する店舗数。 */
export const RECOMMENDATIONS_PER_CATEGORY = 3;

/** 日次推薦の対象とする昼食向けホットペッパーカテゴリ。 */
export const LUNCH_RECOMMENDATION_CATEGORIES = [
  "創作料理",
  "和食",
  "洋食",
  "イタリアン・フレンチ",
  "中華",
  "焼肉・ホルモン",
  "韓国料理",
  "アジア・エスニック料理",
  "各国料理",
  "ラーメン",
  "カフェ・スイーツ",
] as const;

/** 日次推薦で利用する昼食カテゴリ。 */
export type LunchRecommendationCategory =
  (typeof LUNCH_RECOMMENDATION_CATEGORIES)[number];

/**
 * ホットペッパーカテゴリをNearby Searchのprimary typeへ変換する。
 * 各Google primary typeはカテゴリ間で重複しないように割り当てる。
 */
export const GOOGLE_PRIMARY_TYPES_BY_LUNCH_CATEGORY = {
  創作料理: ["fusion_restaurant", "asian_fusion_restaurant"],
  和食: [
    "japanese_restaurant",
    "sushi_restaurant",
    "tonkatsu_restaurant",
    "yakitori_restaurant",
  ],
  洋食: ["western_restaurant", "family_restaurant", "steak_house"],
  // biome-ignore format: Turbopackで中点を含むキーを文字列として解釈させる。
  "イタリアン・フレンチ": [
    "italian_restaurant",
    "french_restaurant",
    "bistro",
  ],
  中華: [
    "chinese_restaurant",
    "cantonese_restaurant",
    "dim_sum_restaurant",
    "dumpling_restaurant",
    "chinese_noodle_restaurant",
  ],
  // biome-ignore format: Turbopackで中点を含むキーを文字列として解釈させる。
  "焼肉・ホルモン": [
    "yakiniku_restaurant",
    "korean_barbecue_restaurant",
    "barbecue_restaurant",
  ],
  韓国料理: ["korean_restaurant"],
  // biome-ignore format: Turbopackで中点を含むキーを文字列として解釈させる。
  "アジア・エスニック料理": [
    "asian_restaurant",
    "indian_restaurant",
    "thai_restaurant",
    "vietnamese_restaurant",
    "indonesian_restaurant",
  ],
  各国料理: [
    "american_restaurant",
    "european_restaurant",
    "mediterranean_restaurant",
    "mexican_restaurant",
    "south_american_restaurant",
    "african_restaurant",
  ],
  ラーメン: ["ramen_restaurant"],
  // biome-ignore format: Turbopackで中点を含むキーを文字列として解釈させる。
  "カフェ・スイーツ": [
    "cafe",
    "coffee_shop",
    "dessert_restaurant",
    "dessert_shop",
    "cake_shop",
    "bakery",
  ],
} as const satisfies Record<LunchRecommendationCategory, readonly string[]>;
