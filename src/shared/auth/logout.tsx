/**
 * 認証済みユーザーのlogout処理を提供する。
 * logout完了後はログイン画面の遷移先を使用する。
 */

import { LOGIN_DESTINATION } from "@/constants/constants";
import { signOut } from "@/lib/auth-client";

/**
 * 現在の認証セッションを終了し、ログイン画面へ遷移する。
 *
 * @returns ログアウトと画面遷移の完了を表すPromise。
 */
export async function logout(): Promise<void> {
  await signOut();
  window.location.replace(LOGIN_DESTINATION);
}
