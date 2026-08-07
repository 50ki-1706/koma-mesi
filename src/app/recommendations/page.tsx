/**
 * ジャンルごとのおすすめ飲食店を表示するルートを提供する。
 * ページ固有の処理は持たず、レコメンド画面の描画だけを委譲する。
 */

import { RecommendationsScreen } from "@/app/recommendations/RecommendationsScreen";

/**
 * おすすめ飲食店ページを表示する。
 *
 * @returns ジャンルごとのおすすめ店を配置した画面。
 */
export default function RecommendationsPage() {
  return <RecommendationsScreen />;
}
