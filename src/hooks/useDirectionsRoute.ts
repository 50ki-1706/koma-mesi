"use client";

/**
 * Google Maps Directions API を用いて2地点間の経路を計算するフック。
 * 計算結果は地図上に描画しつつ、距離・所要時間の要約を返す。
 */

import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";

/** 経路の要約情報 */
export type RouteSummary = {
  distanceText: string;
  durationText: string;
};

/** 経路計算の状態 */
export type DirectionsRouteState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "success"; summary: RouteSummary };

/**
 * summary が取得できる形の DirectionsResult かどうかを判定する型ガード。
 * @param result Directions API のレスポンス
 * @returns 距離・所要時間を含む先頭区間が存在する場合に true
 */
function hasRouteSummary(
  result: google.maps.DirectionsResult,
): result is google.maps.DirectionsResult & {
  routes: [
    google.maps.DirectionsRoute & {
      legs: [
        google.maps.DirectionsLeg & {
          distance: google.maps.Distance;
          duration: google.maps.Duration;
        },
      ];
    },
  ];
} {
  const leg = result.routes[0]?.legs[0];
  return leg?.distance !== undefined && leg?.duration !== undefined;
}

/**
 * 出発地から目的地までの経路を計算し、地図上に描画する。
 * @param origin 出発地の緯度経度
 * @param destination 目的地の緯度経度
 * @returns 経路計算の状態と要約情報
 */
export function useDirectionsRoute(
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral,
): DirectionsRouteState {
  const map = useMap();
  const routesLibrary = useMapsLibrary("routes");
  const [state, setState] = useState<DirectionsRouteState>({
    status: "loading",
  });

  useEffect(() => {
    if (!map || !routesLibrary) return;

    const directionsService = new routesLibrary.DirectionsService();
    const directionsRenderer = new routesLibrary.DirectionsRenderer({
      map,
      suppressMarkers: true,
    });
    const originMarker = new google.maps.Marker({
      position: origin,
      map,
      label: { text: "S", color: "#fff" },
    });
    const destinationMarker = new google.maps.Marker({
      position: destination,
      map,
      label: { text: "G", color: "#fff" },
    });

    setState({ status: "loading" });

    directionsService
      .route({
        origin,
        destination,
        travelMode: google.maps.TravelMode.WALKING,
      })
      .then((result) => {
        directionsRenderer.setDirections(result);

        if (!hasRouteSummary(result)) {
          setState({ status: "error" });
          return;
        }

        const leg = result.routes[0].legs[0];
        setState({
          status: "success",
          summary: {
            distanceText: leg.distance.text,
            durationText: leg.duration.text,
          },
        });
      })
      .catch(() => {
        setState({ status: "error" });
      });

    return () => {
      directionsRenderer.setMap(null);
      originMarker.setMap(null);
      destinationMarker.setMap(null);
    };
  }, [map, routesLibrary, origin, destination]);

  return state;
}
