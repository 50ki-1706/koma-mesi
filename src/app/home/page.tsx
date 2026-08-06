/**
 * 初期設定後のホームルートを提供する。
 * ページ固有の処理は持たず、ホーム画面の描画だけを委譲する。
 */

import { HomeScreen } from "@/app/home/HomeScreen";

/**
 * ホーム画面を表示する。
 *
 * @returns ログアウト操作を配置したホーム画面。
 */
export default function HomePage() {
  return <HomeScreen />;
}