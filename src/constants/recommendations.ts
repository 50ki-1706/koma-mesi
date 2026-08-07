/**
 * 飲食店レコメンドページで使用する定数を定義する。
 * ルートパスとスワイプ判定の閾値を一箇所に集約する。
 */

/** レコメンドページのルートパス。 */
export const RECOMMENDATIONS_PATH = "/recommendations";

/** スワイプとして判定する最小移動距離（px）。 */
export const SWIPE_THRESHOLD_PX = 48;

/** 徒歩時間の目安を計算するときの歩行速度（m/分）。 */
export const WALKING_SPEED_METERS_PER_MINUTE = 80;

/** 距離グループごとの画面表示名。 */
export const DISTANCE_GROUP_LABELS = {
  near: "近距離",
  middle: "中距離",
  far: "遠距離",
} as const;
