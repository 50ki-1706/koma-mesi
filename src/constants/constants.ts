/**
 * プロジェクト全体で利用する定数を定義する。
 * 認証、UI、データベース、地図、初期設定、レコメンドの各領域をカバーする。
 */

// ── Auth ──

/** Destination shown after a successful login. */
export const LOGIN_DESTINATION = "/";

// ── Breakpoints ──

/** Tailwindのlgブレークポイント(1024px)に対応するメディアクエリ。 */
export const LG_BREAKPOINT_QUERY = "(min-width: 1024px)";

// ── Database ──

/** Default database URL for local development when DATABASE_URL is not set */
export const DEFAULT_DATABASE_URL = "file:local.db";

// ── Gestures ──

/** スワイプとして判定する最小移動距離（px）。 */
export const SWIPE_THRESHOLD_PX = 48;

// ── Initial Setup ──

/** 初期設定フォームで選択できる都道府県名の一覧。 */
export const PREFECTURES = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
] as const;

/** 初期設定フォームで選択できる平日の表示名と値の一覧。 */
export const WEEKDAYS = [
  { label: "月曜日", value: "monday" },
  { label: "火曜日", value: "tuesday" },
  { label: "水曜日", value: "wednesday" },
  { label: "木曜日", value: "thursday" },
  { label: "金曜日", value: "friday" },
] as const;

/** `WEEKDAYS` から導出した平日の値。 */
export type WeekdayValue = (typeof WEEKDAYS)[number]["value"];

/** 初期設定時に選択する既定の昼休み曜日。 */
export const DEFAULT_LUNCH_DAYS: WeekdayValue[] = [
  "monday",
  "wednesday",
  "friday",
];

/** Destination shown after completing initial setup. */
export const INITIAL_SETUP_DESTINATION = "/recommendations";

/** 終了時刻が開始時刻以前になっている場合のエラーメッセージ。 */
export const LUNCH_TIME_RANGE_ERROR_MESSAGE =
  "終了時刻は開始時刻より後の時間を入力してください。";

// ── Maps ──

/** 地図の初期ズームレベル。 */
export const DEFAULT_MAP_ZOOM = 16;

// ── Recommendations ──

/** 店舗カードの写真を切り替える間隔（ミリ秒）。 */
export const RECOMMENDATION_PHOTO_INTERVAL_MS = 5000;

/** Places API (New) から店舗写真を取得する際の最大幅（px）。 */
export const RECOMMENDATION_PHOTO_MAX_WIDTH_PX = 800;

// ── Recommendation Schema ──

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
