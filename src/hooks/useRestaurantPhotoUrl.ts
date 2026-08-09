/**
 * Google Place IDから店舗写真のURLをブラウザ側で都度取得するフック。
 * 写真はDBに保存していないため、表示のたびにPlaces API (New)を呼び出す。
 */

"use client";

import { useEffect, useState } from "react";
import { RECOMMENDATION_PHOTO_MAX_WIDTH_PX } from "@/constants/constants";
import { useGoogleMapsApiKey } from "@/hooks/useGoogleMapsApiKey";

const GOOGLE_PLACES_API_BASE_URL = "https://places.googleapis.com/v1";

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
 * Google Place IDから店舗写真のURLを取得する。
 *
 * @param googlePlaceId - Google Place ID。
 * @returns 写真URL。未設定・未取得・取得失敗の場合はnull。
 */
export function useRestaurantPhotoUrl(googlePlaceId: string): string | null {
  const apiKey = useGoogleMapsApiKey();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    setPhotoUrl(null);
    if (apiKey === undefined) {
      return;
    }

    let cancelled = false;

    fetch(
      `${GOOGLE_PLACES_API_BASE_URL}/places/${encodeURIComponent(googlePlaceId)}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "photos",
        },
      },
    )
      .then((response) => response.json())
      .then((data: unknown) => {
        if (cancelled) {
          return;
        }
        const photoName = extractFirstPhotoName(data);
        if (photoName !== null) {
          setPhotoUrl(
            `${GOOGLE_PLACES_API_BASE_URL}/${photoName}/media?maxWidthPx=${RECOMMENDATION_PHOTO_MAX_WIDTH_PX}&key=${apiKey}`,
          );
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to fetch restaurant photo:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, googlePlaceId]);

  return photoUrl;
}
