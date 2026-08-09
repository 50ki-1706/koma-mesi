/**
 * ログインユーザーが登録した大学（キャンパス）の位置を取得するフック。
 * user_preferencesに保存された緯度経度をorpc経由で取得する。
 */

"use client";

import { useEffect, useState } from "react";
import { orpc } from "@/lib/orpc/client";

/** 大学位置の取得結果とリクエスト状態。 */
export interface UniversityLocationState {
  location: google.maps.LatLngLiteral | null;
  isLoading: boolean;
  hasError: boolean;
}

/**
 * ログインユーザーの大学の緯度経度を取得する。
 *
 * @returns 大学の位置と、取得中・取得失敗の状態。
 */
export function useUniversityLocation(): UniversityLocationState {
  const [location, setLocation] = useState<google.maps.LatLngLiteral | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    orpc.initialSetup
      .status()
      .then(({ campusLocation }) => {
        if (cancelled) {
          return;
        }
        setLocation(
          campusLocation === null
            ? null
            : {
                lat: campusLocation.latitude,
                lng: campusLocation.longitude,
              },
        );
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        console.error("Failed to fetch campus location:", error);
        setHasError(true);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { location, isLoading, hasError };
}
