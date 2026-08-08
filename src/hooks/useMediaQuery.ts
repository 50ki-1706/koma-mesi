"use client";

/**
 * 指定したメディアクエリに現在のビューポートが一致するかを返すフック。
 * SSR時はfalseを返し、クライアントでの一致状態変化に追従する。
 */

import { useEffect, useState } from "react";

/**
 * メディアクエリの一致状態を取得する。
 *
 * @param query 判定対象のメディアクエリ文字列。
 * @returns クエリに一致していればtrue。SSR・初回マウント直後は常にfalse。
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    setMatches(mediaQueryList.matches);

    const handleChange = (event: MediaQueryListEvent): void => {
      setMatches(event.matches);
    };

    mediaQueryList.addEventListener("change", handleChange);
    return () => {
      mediaQueryList.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}
