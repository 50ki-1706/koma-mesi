# ADR: recommendationページへの地図表示の統合

- **Status:** Accepted
- **Date:** 2026-08-08

## Context

`/recommendations` ページで、現在選択中の店の位置を地図で確認できるようにしたい。地図表示自体は `feature/map-page` ブランチで先行実装済みだったが、[20260807-restaurant-recommendation-data-model.md](20260807-restaurant-recommendation-data-model.md) の時点では「本機能のブランチには含まれておらず、依存させない」と決めていた。今回、その統合を行う。

検討が必要だった点:

- 画面のどの範囲に地図を配置するか（レコメンドページは `h-dvh` のスマホ想定1カラムレイアウトで、左右分割は存在しなかった）
- `feature/map-page` には地図本体に加え、2地点間の経路（距離・所要時間、Directions API）を表示する `RoutePanel` もセットで実装されていたが、そのまま持ち込むかどうか
- `feature/map-page` の経路は東京駅→スカイツリーの座標がハードコードされており、`recommendation` テーブルには緯度経度が存在しなかった。地図に表示する店の位置をどう得るか

## Decision

### PC/タブレット幅（`lg:` 以上）でのみ左右2カラムにし、地図は右側に配置する

`RecommendationsScreen` を `lg:flex-row` に変更し、左カラムに既存のヘッダー・カルーセル・ボトムシートのトリガーを、右カラムに地図を配置する。`lg` 未満（スマホ幅）では地図を非表示にし、既存の縦1カラムレイアウトのまま変更しない。

この設計にした理由:

- 本アプリはスマホでの利用を主要な想定としており、既存レイアウト（スワイプ・ボトムシート）はモバイル前提で作られている。狭い画面に地図を無理に押し込むと、カルーセルやボトムシートの操作性を損なう
- PC/タブレット幅では余白が生まれるため、その領域を使って地図を追加表示するほうがKISSに沿う

### 地図表示のみを持ち込み、経路パネル（Directions API連携）は持ち込まない

`feature/map-page` の `MapView`/`RoutePanel`/`useDirectionsRoute` のうち、`GoogleMap` + マーカー表示部分のみを `src/app/recommendations/RecommendationMap.tsx` としてコロケーションし、経路計算・`RoutePanel` は持ち込まなかった。

この設計にした理由:

- 現時点で必要なのは「選択中の店の位置を地図上で確認できること」であり、大学からの経路案内はスコープ外（YAGNI）
- Directions API連携が必要になった場合、`useDirectionsRoute` を再度移植すれば足りるため、先に作り込む必要はない

### `recommendation` テーブルに `latitude`/`longitude` カラムを追加する

`recommendation` テーブルに `latitude`(real, not null)・`longitude`(real, not null) を追加し、地図の中心・マーカー位置として使用する。`feature/map-page` のようなハードコードされた固定座標は使わない。

この設計にした理由:

- 住所文字列だけでは地図上の位置を一意に決められず、店ごとに異なる座標が必要
- 実行時ジオコーディング（住所→座標変換）はAPI呼び出しが増え、[20260807-restaurant-recommendation-data-model.md](20260807-restaurant-recommendation-data-model.md) で決めた「距離・時間は事前計算した静的な値を使う」という方針と一貫させ、座標も登録時に確定させる静的な値として扱う

## Consequences

- `recommendation` テーブルへのレコード登録・更新時に、緯度経度も併せて用意する必要がある（既存の `distance_meters`/`duration_minutes` の運用と同様）
- 既存マイグレーション適用後のDBに対しては `drizzle/0002_violet_gateway.sql` の適用が必要（`latitude`/`longitude` はデフォルト値なしのNOT NULLのため、既存行がある場合は事前にバックフィルが必要）
- 経路表示（距離・所要時間、Directions API）が今後必要になった場合は、`feature/map-page` の `useDirectionsRoute`/`RoutePanel` を移植する形で追加する
- 地図はスマホ幅（`lg` 未満）では表示されないため、モバイルで位置を確認したいという要望が出た場合は別途UI設計が必要
