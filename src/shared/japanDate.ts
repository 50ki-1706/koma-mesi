/**
 * Dateと日本時間のカレンダー日付を相互に扱う共通処理を提供する。
 * 推薦生成・取得・Cronで同じ日付境界を利用する。
 */

import { JAPAN_TIME_ZONE } from "@/constants/dateTime";

/**
 * Dateを日本時間のYYYY-MM-DDへ変換する。
 *
 * @param date - 対象時刻。
 * @returns 日本時間の日付文字列。
 */
export function formatJapanDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: JAPAN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}
