"use client";

/**
 * recommendationページの右側に表示する、大学から選択中の店舗までの経路地図。
 * `/recommendations` に colocate された地図コンポーネント。距離・所要時間は
 * カード側に表示済みのため、ここでは経路線とマーカーのみを描画する。
 */

import { APIProvider, Map as GoogleMap } from "@vis.gl/react-google-maps";
import { DEFAULT_MAP_ZOOM } from "@/constants/maps";
import { useDirectionsRoute } from "@/hooks/useDirectionsRoute";
import { useGoogleMapsApiKey } from "@/hooks/useGoogleMapsApiKey";

interface RecommendationMapProps {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
}

/**
 * 経路計算をトリガーし、地図上に描画する。表示するJSXは持たない。
 *
 * @param props - 出発地（大学）と目的地（店舗）。
 * @returns なし。
 */
function RouteLayer({
  origin,
  destination,
}: {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
}) {
  useDirectionsRoute(origin, destination);
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

  if (apiKey === undefined) {
    return (
      <div className="grid size-full place-items-center rounded-2xl border border-line bg-surface p-6 text-center text-sm text-ink-muted">
        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY が設定されていません。
      </div>
    );
  }

  return (
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
      <RouteLayer origin={origin} destination={destination} />
    </APIProvider>
  );
}
