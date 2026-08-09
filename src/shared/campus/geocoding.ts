/**
 * Google Geocoding APIで大学住所を緯度経度へ変換する。
 * 該当なしの場合はnullを返し、通信・応答異常は例外として扱う。
 */

import { z } from "zod";
import { GOOGLE_GEOCODING_REQUEST_TIMEOUT_MS } from "@/constants/campus";

const GOOGLE_GEOCODING_API_BASE_URL =
  "https://maps.googleapis.com/maps/api/geocode/json";
const GOOGLE_GEOCODING_LANGUAGE = "ja";
const GOOGLE_GEOCODING_REGION = "jp";

const GoogleGeocodingResponseSchema = z.object({
  status: z.string(),
  results: z
    .array(
      z.object({
        geometry: z.object({
          location: z.object({
            lat: z.number().min(-90).max(90),
            lng: z.number().min(-180).max(180),
          }),
        }),
      }),
    )
    .default([]),
});

/** ジオコーディングで得られる座標。 */
export interface GeocodedLocation {
  latitude: number;
  longitude: number;
}

/** Google Geocoding APIとの通信に失敗したことを表すエラー。 */
export class GeocodingError extends Error {
  /**
   * ジオコーディングエラーを生成する。
   *
   * @param message - ログに使用するメッセージ。
   * @param options - 元のエラーなど、診断に必要な追加情報。
   */
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "GeocodingError";
  }
}

/**
 * 捕捉した値がfetchのタイムアウト例外か判定する。
 *
 * @param error - fetchから投げられた値。
 * @returns TimeoutErrorならtrue。
 */
function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.name === "TimeoutError";
}

/**
 * 住所を緯度経度へ変換する。
 *
 * @param address - ジオコーディング対象の住所。
 * @param apiKey - サーバー用Google Maps APIキー。
 * @param fetchImplementation - テストで差し替え可能なfetch実装。
 * @returns 変換できた座標。該当住所がない場合はnull。
 * @throws {GeocodingError} 通信・タイムアウト・応答形式の異常時。
 */
export async function geocodeAddress(
  address: string,
  apiKey: string,
  fetchImplementation: typeof fetch = fetch,
): Promise<GeocodedLocation | null> {
  const url = new URL(GOOGLE_GEOCODING_API_BASE_URL);
  url.searchParams.set("address", address);
  url.searchParams.set("language", GOOGLE_GEOCODING_LANGUAGE);
  url.searchParams.set("region", GOOGLE_GEOCODING_REGION);
  url.searchParams.set("key", apiKey);

  let response: Response;
  try {
    response = await fetchImplementation(url, {
      signal: AbortSignal.timeout(GOOGLE_GEOCODING_REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new GeocodingError("Geocodingがタイムアウトしました。", {
        cause: error,
      });
    }
    throw new GeocodingError("Geocodingへの通信に失敗しました。", {
      cause: error,
    });
  }

  if (!response.ok) {
    throw new GeocodingError(
      `Geocodingに失敗しました（HTTP ${response.status}）。`,
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (error) {
    throw new GeocodingError("Geocodingの応答形式が不正です。", {
      cause: error,
    });
  }

  const parsed = GoogleGeocodingResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new GeocodingError("Geocodingの応答形式が不正です。", {
      cause: parsed.error,
    });
  }

  if (parsed.data.status === "ZERO_RESULTS") {
    return null;
  }

  if (parsed.data.status !== "OK") {
    throw new GeocodingError("Geocodingがエラーを返しました。");
  }

  const location = parsed.data.results[0]?.geometry.location;
  if (location === undefined) {
    return null;
  }

  return { latitude: location.lat, longitude: location.lng };
}
