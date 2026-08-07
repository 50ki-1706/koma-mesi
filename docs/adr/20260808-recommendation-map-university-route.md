# ADR: recommendation地図に大学→店舗の経路を表示する

- **Status:** Accepted
- **Date:** 2026-08-08

## Context

[20260808-recommendation-map-integration.md](20260808-recommendation-map-integration.md) で、recommendationページ右側の地図は「地図表示のみ（店舗の位置にピンを立てるだけ）」とし、経路パネル（`feature/map-page` の `RoutePanel`/`useDirectionsRoute`）は持ち込まない方針にしていた。

その後、「出発地をログイン時に指定した大学の位置にして、大学から店舗までのルートを地図に出したい」という要望が入った。あわせて調査した結果、次の事実が判明した:

- ログイン後のオンボーディング画面（`InitialSetupForm.tsx`）には大学の住所を入力する欄があるが、`useInitialSetup.tsx` の送信処理はその値を一切読み取らずlocalStorageに完了フラグを立てるのみで、**大学の住所・座標はDBに保存されていない**
- `user`テーブルにも大学の位置に相当するカラムは存在しない
- 大学の緯度経度専用のテーブル設計（`user_preferences`への追加を想定）はユーザー側で別途ER図を用意して指示する予定であり、今回のスコープでは確定していない

## Decision

### 経路線・出発地/目的地マーカーのみ描画し、距離・所要時間のテキストパネルは追加しない

`feature/map-page` の `useDirectionsRoute`（Directions APIで徒歩経路を計算し、地図上に経路線とS/Gマーカーを描画する）を `src/hooks/useDirectionsRoute.ts` に移植し、`RecommendationMap`(`src/app/recommendations/RecommendationMap.tsx`) から使用する。ただし `RoutePanel` 相当の距離・所要時間テキスト表示は追加しない。

この設計にした理由:

- 距離・所要時間はすでに `RecommendationCard` に表示済み（[20260807-restaurant-recommendation-data-model.md](20260807-restaurant-recommendation-data-model.md) で決めた `distanceMeters`/`durationMinutes` の静的表示）であり、地図上に重複して出す必要がない
- 地図側の役割は「経路の視覚的な把握」に絞り、UIをシンプルに保つ

### 大学の位置は、実データ連携が整うまで固定値を返すフック(`useUniversityLocation`)経由で取得する

`src/hooks/useUniversityLocation.ts` を新設し、現時点では固定の座標（新宿駅付近）を返す。`RecommendationsScreen` はこのフックの戻り値を経路の出発地として `RecommendationMap` に渡す。

この設計にした理由:

- 大学位置の永続化先（`user_preferences` へのカラム追加）はユーザーからのER図待ちで、今回のスコープには含めない
- `useRecommendations.ts` の `DEMO_ITEMS`（実データ未接続時のダミー表示、TODOコメント付き）と同じパターンを踏襲し、呼び出し側（`RecommendationsScreen`/`RecommendationMap`）のインターフェースを変えずに、後から `useUniversityLocation` の中身だけをorpc経由の実装に差し替えられるようにした

## Consequences

- 現時点では地図上の「大学」の位置は実際のログインユーザーの大学とは無関係な固定値であり、実データではない。ユーザーからの目視確認時に紛らわしくなる可能性がある
- 大学位置の永続化（`user_preferences`へのlatitude/longitude追加）とその取得用orpcルーターの実装が別途必要。ER図の共有を受けて対応する
- 経路計算はDirections APIをクライアントサイドから店舗切り替えのたびに呼び出すため、APIの利用量・レイテンシが発生する。将来的にレート制限やキャッシュが必要になる可能性がある
