/**
 * ログインユーザーが登録した大学（キャンパス）の位置を取得するフック。
 * user_preferencesへの緯度経度保存が未実装のため、暫定的に固定値を返す。
 */

// TODO: user_preferencesにlatitude/longitudeが追加され次第、
// orpc経由でログインユーザーの大学位置を取得する実装に置き換える。
const PLACEHOLDER_UNIVERSITY_LOCATION: google.maps.LatLngLiteral = {
  lat: 35.6896,
  lng: 139.7006,
};

/**
 * ログインユーザーの大学の緯度経度を取得する。
 * @returns 大学の位置（現状は仮の固定値）
 */
export function useUniversityLocation(): google.maps.LatLngLiteral {
  return PLACEHOLDER_UNIVERSITY_LOCATION;
}
