/**
 * Google Maps API キーの環境変数取得を担うフック。
 * ページコンポーネントから環境変数への直接アクセスを分離する。
 */

/**
 * 環境変数から Google Maps API キーを取得する。
 * @returns API キー。未設定の場合は undefined
 */
export function useGoogleMapsApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
}
