# PR作成・運用ルール

このドキュメントは、Pull Request（PR）の作成方法と運用ルールを定めます。PRの品質を一貫させ、レビューとマージをスムーズにすることが目的です。

## マージ方法

このリポジトリでは、`main` ブランチへのマージに**スカッシュマージ**を使用します。

- PRの全コミットを1つにまとめてマージします
- マージコミットのメッセージ（1行目）は**PRタイトルと同一**にします
- マージコミットのボディには、PRに含まれる**コミットの一覧**を記載します

## PRタイトル

PRタイトルは [Conventional Commits](https://www.conventionalcommits.org/) 形式で記述します。マージコミットのメッセージになるため、コミットメッセージ規則に従います。

### 形式

```text
<type>(<scope>): <description>
```

- `scope` は省略可能です
- 破壊的変更がある場合は `!` を追加します: `feat(api)!: remove deprecated endpoint`

### 使用可能な型

| 型 | 用途 |
| --- | --- |
| `feat` | 新機能の追加 |
| `fix` | 不具合修正 |
| `docs` | ドキュメントのみの変更 |
| `style` | コードの意味に影響しない変更（空白、フォーマットなど） |
| `refactor` | 機能追加でもバグ修正でもないコード変更 |
| `perf` | パフォーマンス改善 |
| `test` | テストの追加・修正 |
| `build` | ビルドシステムまたは外部依存の変更 |
| `ci` | CI設定の変更 |
| `chore` | その他の保守作業 |
| `revert` | 以前のコミットを取り消し |

この型は `cog.toml` の定義と同期されています。

### description の書き方

- 英小文字で始める
- 末尾にピリオドを付けない
- 現在形・三人称単数形を使う（例: `add`、`fix`、`update`）
- 簡潔に、何をしたかを表す（50文字以内を目安）

### 例

適切なPRタイトル:

```text
feat: add user authentication
fix(api): prevent duplicate order creation
docs: update branch naming rules
refactor: extract payment logic to service layer
ci: add build cache to workflow
feat(api)!: change response format for /users
```

避けるPRタイトル:

| PRタイトル | 理由 |
| --- | --- |
| `変更` | 型がなく、内容が不明 |
| `feat: Added new feature.` | 大文字で始まり、末尾にピリオドがある |
| `update stuff` | 型がなく、内容が曖昧 |
| `FEAT: ADD USER AUTH` | 型・説明が大文字 |

## PR本文

PR本文はリポジトリのPRテンプレート（`.github/pull_request_template.md`）に従って記述します。

```text
## Summary
- 変更の概要
## Why
- なぜこの変更が必要なのか
## Validation
- テスト結果
## Review Points
- 特にレビューしてほしい点
```

各セクションは省略せず、必ず記入してください。

## PRの作成粒度

**1つの機能に対して1つのPR** を基本とします。

- 複数の機能を1つのPRに含めないでください
- 1つのPRは、独立してレビュー・マージ可能な単位にしてください
- 大きな機能は、レビュー可能なサイズに分割してください
- 関連する変更でも、種類が異なる場合はPRを分けてください（例: 機能追加とリファクタリング）

例外:

- 小さな修正や設定変更など、明らかに1つの方が自然な場合はこの限りではありません

## ブランチからPRの作成

1. 作業ブランチで変更をコミットします（ブランチ命名規則は `docs/branch-naming.md` を参照）
2. ブランチをリモートにプッシュします
3. `main` をベースにしてPRを作成します
4. PRタイトルと本文をこのドキュメントの規則に従って記入します
5. CIが通過することを確認します

## レビューとマージ

1. PRを作成したら、レビューを依頼します
2. CI（`pnpm verify`、`pnpm build`）がすべて通過することを確認します
3. レビュー指摘に対応後、スカッシュマージで `main` にマージします
4. マージ時のコミットメッセージはPRタイトルと同一にします

## 注意事項

- `cog check`（CI）は各コミットメッセージを検証しますが、PRタイトル自体は検証しません。PRタイトルの形式は作成者が責任を持って守ってください
- エージェントがPRを作成する場合は、`$create-pr` スキルを使用します
