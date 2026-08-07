/**
 * 初期設定フォームで使用する選択肢と初期値を定義する。
 * 表示順と型を一箇所に集約し、フォーム間の差異を防ぐ。
 */

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

export const WEEKDAYS = [
  { label: "月曜日", value: "monday" },
  { label: "火曜日", value: "tuesday" },
  { label: "水曜日", value: "wednesday" },
  { label: "木曜日", value: "thursday" },
  { label: "金曜日", value: "friday" },
] as const;

export type WeekdayValue = (typeof WEEKDAYS)[number]["value"];

export const DEFAULT_LUNCH_DAYS: WeekdayValue[] = [
  "monday",
  "wednesday",
  "friday",
];

export const INITIAL_SETUP_DESTINATION = "/recommendations";
export const INITIAL_SETUP_STORAGE_KEY_PREFIX =
  "koma-mesi:initial-setup-completed";

export const INITIAL_SETUP_DETAILS_STORAGE_KEY_PREFIX =
  "koma-mesi:initial-setup-details";
