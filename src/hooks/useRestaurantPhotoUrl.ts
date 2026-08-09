/**
 * Google Place IDから店舗写真のURLを取得し、カード表示へ提供するフック。
 * 成功した写真URLはページ内で共有し、不要なPlaces API (New)の呼び出しを避ける。
 */

"use client";

import { useEffect, useState } from "react";
import {
  GOOGLE_PLACES_API_BASE_URL,
  RECOMMENDATION_PHOTO_MAX_WIDTH_PX,
} from "@/constants/constants";
import { useGoogleMapsApiKey } from "@/hooks/useGoogleMapsApiKey";

const restaurantPhotoUrlCache = new Map<string, string>();

/**
 * 値がキー参照可能なオブジェクトかを判定する。
 *
 * @param value - 判定対象の値。
 * @returns nullではないオブジェクトの場合はtrue。
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Places API (New) の応答から最初の写真リソース名を取り出す。
 *
 * @param value - Place Detailsレスポンスとして受信した値。
 * @returns 写真リソース名。取得できない場合はnull。
 */
function extractFirstPhotoName(value: unknown): string | null {
  if (!isRecord(value) || !Array.isArray(value.photos)) {
    return null;
  }
  const first: unknown = value.photos[0];
  if (!isRecord(first) || typeof first.name !== "string") {
    return null;
  }
  return first.name;
}

/**
 * エラーがAbortControllerによる中断かを判定する。
 *
 * @param error - 判定対象のエラー。
 * @returns AbortErrorの場合はtrue。
 */
function isAbortError(error: unknown): boolean {
  return isRecord(error) && error.name === "AbortError";
}

/**
 * Google Place IDから店舗写真のURLを取得する。
 *
 * @param googlePlaceId - Google Place ID。
 * @returns 写真URL。未設定・未取得・取得失敗の場合はnull。
 */
export function useRestaurantPhotoUrl(googlePlaceId: string): string | null {
  const apiKey = useGoogleMapsApiKey();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const cachedPhotoUrl = restaurantPhotoUrlCache.get(googlePlaceId);
    setPhotoUrl(cachedPhotoUrl ?? null);
    if (cachedPhotoUrl !== undefined) {
      return;
    }
    if (apiKey === undefined) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const loadPhotoUrl = async (): Promise<void> => {
      try {
        const response = await fetch(
          `${GOOGLE_PLACES_API_BASE_URL}/places/${encodeURIComponent(googlePlaceId)}`,
          {
            headers: {
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask": "photos",
            },
            signal: controller.signal,
          },
        );
        if (!response.ok) {
          throw new Error("Restaurant photo request failed.");
        }

        const data: unknown = await response.json();
        if (cancelled) {
          return;
        }
        const photoName = extractFirstPhotoName(data);
        if (photoName === null) {
          return;
        }
        const nextPhotoUrl = `${GOOGLE_PLACES_API_BASE_URL}/${photoName}/media?maxWidthPx=${RECOMMENDATION_PHOTO_MAX_WIDTH_PX}&key=${apiKey}`;
        restaurantPhotoUrlCache.set(googlePlaceId, nextPhotoUrl);
        setPhotoUrl(nextPhotoUrl);
      } catch (error: unknown) {
        if (cancelled || isAbortError(error)) {
          return;
        }
        console.error("Failed to fetch restaurant photo.");
      }
    };

    void loadPhotoUrl();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [apiKey, googlePlaceId]);

  return photoUrl;
}
