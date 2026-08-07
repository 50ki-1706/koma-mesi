/**
 * アカウント情報を確認するルートを提供する。
 * ページ固有のロジックは持たず、アカウント画面へ描画を委譲する。
 */

import { AccountScreen } from "@/app/account/AccountScreen";

/**
 * アカウントページを表示する。
 *
 * @returns 初期設定内容とログアウト操作を配置した画面。
 */
export default function AccountPage() {
  return <AccountScreen />;
}
