/**
 * アカウントページの認証状態を管理する。
 * ユーザー情報とログアウト操作を提供する。
 */

"use client";

import { useSession } from "@/lib/auth-client";
import { logout } from "@/shared/auth/logout";

/** アカウント画面の表示状態と操作をまとめたコントローラー。 */
export interface AccountController {
  isPending: boolean;
  isAuthenticated: boolean;
  userName: string | null;
  userEmail: string | null;
  handleSignOut: () => void;
}

/**
 * アカウントページに必要な認証情報を返す。
 *
 * @returns 認証状態、ユーザー情報、ログアウト操作。
 */
export function useAccount(): AccountController {
  const { data: session, isPending: isSessionPending } = useSession();
  /** 現在のセッションからログアウトする。 */
  const handleSignOut = (): void => {
    void logout();
  };

  return {
    isPending: isSessionPending,
    isAuthenticated: Boolean(session),
    userName: session?.user.name ?? null,
    userEmail: session?.user.email ?? null,
    handleSignOut,
  };
}
