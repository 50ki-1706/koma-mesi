# プロジェクト概要

- **技術スタック**: Next.js 16, React 19, TypeScript 6, Tailwind CSS v4
- **パッケージマネージャ**: pnpm 11
- **データベース**: libSQL + Drizzle ORM
- **認証**: better-auth
- **API**: oRPC (server/client)
- **バリデーション**: Zod v4
- **リンター/フォーマッター**: Biome 2.2
- **テスト**: Vitest 4
- **UI開発**: Storybook 10

# コードレビュー指示

レビューコメントは以下の構造化フォーマットで出力してください:

- **Issue**: 問題点を具体的に指摘
- **Suggestion**: 改善案を具体的に提示
- **Why**: なぜその改善が必要かの理由

## レビュー観点の優先順位

1. **セキュリティ** — 入力バリデーション、認証、SQLインジェクション、XSS
2. **型安全性** — any不使用、unknown型 + 型ガード、strict mode
3. **パフォーマンス** — 不要な再レンダリング、バンドルサイズ
4. **可読性・保守性** — KISS/DRY/YAGNI、責務の分離
5. **テスト** — バックエンドはテスト必須、フロントエンドはテスト不要

## アーキテクチャ規約

- APIは **Controller → Service → Repository → Model** の4層構造で記述
- 各ページ(`page.tsx`)にはロジックを直接書かず、`src/hooks/` にカスタムフックを定義
- 共通UIコンポーネントは `src/shared/components/` に配置
- 定数は `src/constants/` に定義
- 共通処理は `src/shared/` に定義
- コロケーションを重視（関連ファイルは近くに配置）

## コード品質規約

- KISS、DRY、YAGNI を守る
- `any` 型は使用禁止。`unknown` 型 + 型ガードを使用
- すべての `.ts` / `.tsx` ファイル冒頭に、ファイルの役割・責務を2行程度で記述（必須）
- TSDoc は必須（`@param`, `@returns` など）
- 自明なコードに対するインラインコメントは不要。コメントは以下の場合のみ付与:
  - 非自明な実装意図の説明
  - 複雑な関数の要約
  - 将来の修正予定（TODO）
- ファイル冒頭の役割記述とTSDocは必須（インラインコメント不要の例外）

## 設計規約

- 絵文字は使用しない
- Tailwind デフォルトカラーは使わず、プロジェクト固有のデザイントークン（oklch）を使用
- UIは視線の流れを意識
- 設計上の重要な判断は `docs/adr/` に ADR として記録（append-only、過去の内容は変更しない）
- `docs/` 以下にドキュメントがあるため、必要なときに参照すること。ファイル名で判断すること。追加時はわかりやすい名前をつけること

## テスト・検証方針

- **バックエンド**: テストコード必須
- **フロントエンド**: テストコード不要
- コード実装後は必ず `pnpm verify`（型チェック + テスト実行 + Biomeチェック）で検証すること
- スクリプト実行時は `&&` で連結せず、1つずつ実行すること

## 許可スクリプト

`package.json` 定義のスクリプトのみ使用可能:
- `pnpm dev` / `pnpm build` / `pnpm start`
- `pnpm check` (Biome) / `pnpm format` (Biome) / `pnpm typecheck`
- `pnpm test:run` (Vitest)
- `pnpm verify:frontend` / `pnpm verify`
- `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:push` / `pnpm db:reset`
- `pnpm build-storybook`
