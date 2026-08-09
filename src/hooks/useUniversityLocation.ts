/**
 * ログインユーザーが登録した大学（キャンパス）の位置を取得するフック。
 * user_preferencesに保存された緯度経度をorpc経由で取得する。
 */

"use client";

import { useEffect, useState } from "react";
import { orpc } from "@/lib/orpc/client";

/**
 * ログインユーザーの大学の緯度経度を取得する。
 * @returns 大学の位置。未取得または未設定の場合はnull。
 */
export function useUniversityLocation(): google.maps.LatLngLiteral | null {
  const [location, setLocation] = useState<google.maps.LatLngLiteral | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    orpc.initialSetup
      .status()
      .then(({ campusLocation }) => {
        if (cancelled || campusLocation === null) {
          return;
        }
        setLocation({
          lat: campusLocation.latitude,
          lng: campusLocation.longitude,
        });
      })
      .catch((error) => {
        console.error("Failed to fetch campus location:", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return location;
}
