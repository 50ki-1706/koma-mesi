"use client";

/**
 * recommendationページの右側に表示する、大学から選択中の店舗までの経路地図。
 * `/recommendations` に colocate された地図コンポーネント。距離・所要時間は
 * カード側に表示済みのため、ここでは経路線とマーカーのみを描画する。
 */

import { APIProvider, Map as GoogleMap } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";
import { DEFAULT_MAP_ZOOM } from "@/constants/constants";
import { useDirectionsRoute } from "@/hooks/useDirectionsRoute";
import { useGoogleMapsApiKey } from "@/hooks/useGoogleMapsApiKey";

interface RecommendationMapProps {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
}

interface RouteLayerProps {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  onErrorChange: (hasError: boolean) => void;
}

/**
 * 経路計算をトリガーし、地図上に描画する。エラー発生時は親に通知する。
 *
 * @param props - 出発地（大学）・目的地（店舗）・エラー状態変化時のコールバック。
 * @returns なし。
 */
function RouteLayer({ origin, destination, onErrorChange }: RouteLayerProps) {
  const route = useDirectionsRoute(origin, destination);

  useEffect(() => {
    onErrorChange(route.status === "error");
  }, [route.status, onErrorChange]);

  return null;
}

/**
 * 大学から店舗までの徒歩経路を地図上に表示する。
 *
 * @param props - 出発地（大学）と目的地（店舗）の緯度経度。
 * @returns APIキー未設定時は案内文、それ以外は経路付きの地図。
 */
export function RecommendationMap({
  origin,
  destination,
}: RecommendationMapProps) {
  const apiKey = useGoogleMapsApiKey();
  const [hasRouteError, setHasRouteError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  if (apiKey === undefined) {
    return (
      <div className="grid size-full place-items-center rounded-2xl border border-line bg-surface p-6 text-center text-sm text-ink-muted">
        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY が設定されていません。
      </div>
    );
  }

  return (
    <div className="relative size-full">
      <APIProvider apiKey={apiKey} libraries={["routes"]}>
        <GoogleMap
          key={`${origin.lat},${origin.lng}-${destination.lat},${destination.lng}`}
          className="size-full overflow-hidden rounded-2xl"
          defaultCenter={destination}
          defaultZoom={DEFAULT_MAP_ZOOM}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
        />
        <RouteLayer
          key={retryCount}
          origin={origin}
          destination={destination}
          onErrorChange={setHasRouteError}
        />
      </APIProvider>
      {hasRouteError ? (
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-xl bg-surface/95 px-4 py-2 text-xs font-bold text-ink-muted shadow-[0_8px_20px_oklch(0.45_0.08_70/0.16)]">
          <span>経路を取得できませんでした。</span>
          <button
            className="shrink-0 rounded-full bg-brand-soft px-3 py-1 text-ink transition hover:bg-brand-hover hover:text-surface"
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
          >
            再試行
          </button>
        </div>
      ) : null}
    </div>
  );
}
