/**
 * ホーム画面で利用するクライアント操作を管理する。
 * 認証ライブラリへの依存を表示コンポーネントから分離する。
 */

"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/shared/auth/logout";

/** ホーム画面から実行できる操作。 */
interface HomeController {
  handleSignOut: () => void;
}

/**
 * ホーム画面の操作を返す。
 *
 * @returns ログアウト操作。
 */
export function useHome(): HomeController {
  const _router = useRouter();
  /**
   * 現在の認証セッションからログアウトする。
   *
   * @returns なし。
   */
  const handleSignOut = (): void => {
    void logout();
  };

  return { handleSignOut };
}
