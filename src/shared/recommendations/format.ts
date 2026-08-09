/**
 * おすすめ画面で使う表示用の値を整形する。
 * 徒歩時間など、複数のおすすめコンポーネントで共有する形式を定義する。
 */

/**
 * 秒数を徒歩時間の分数へ変換する。
 *
 * @param seconds - 徒歩にかかる秒数。
 * @returns 最低1分に丸めた徒歩時間。
 */
export function toWalkingMinutes(seconds: number): number {
  return Math.max(1, Math.round(seconds / 60));
}
