import { LOGIN_DESTINATION } from "@/constants/auth";
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