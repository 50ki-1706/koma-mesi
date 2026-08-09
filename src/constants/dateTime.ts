/**
 * アプリケーション全体で使用する日時関連の定数を定義する。
 * 日付境界の判定を日本時間へ統一するために利用する。
 */

/** 日付ベースの業務処理で使用するIANAタイムゾーン。 */
export const JAPAN_TIME_ZONE = "Asia/Tokyo";

/** 1日を構成するミリ秒数。 */
export const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
