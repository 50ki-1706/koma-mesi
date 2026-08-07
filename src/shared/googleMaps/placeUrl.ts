// Google Place IDからGoogle Mapsの店舗ページURLを組み立てる。
// 店舗詳細への導線で共通利用できるURL生成処理を提供する。

/**
 * Google Mapsの店舗ページURLを生成する。
 *
 * @param googlePlaceId - Google Places APIのPlace ID
 * @returns Google Mapsの店舗ページURL
 */
export function buildGoogleMapsPlaceUrl(googlePlaceId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(googlePlaceId)}`;
}
