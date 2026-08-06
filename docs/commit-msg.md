# コミットメッセージ規則

このドキュメントは、プロジェクトのコミットメッセージ規則を定めます。

## 概要

このプロジェクトでは、[Conventional Commits](https://www.conventionalcommits.org/) の形式に従ったコミットメッセージを使用します。
コミットメッセージは [cocogitto](https://github.com/cocogitto/cocogitto) によって検証され、commit-msg git hook 経由で自動的にチェックされます。
規則に違反するコミットメッセージは拒否されるため、すべてのコミットはこの規則に従う必要があります。

## フォーマット

コミットメッセージは以下の形式に従います。

```text
<type>[optional scope][!]: <description>

[optional body]

[optional footer(s)]
```

各要素の意味は以下の通りです。

- `type`: コミットの種類を表す必須のキーワードです。
- `scope`（任意）: 変更の対象範囲を括弧で囲んだ短い名前です。
- `!`（任意）: 破壊的変更を示すマーカーです。
- `description`: 変更内容を簡潔に表す必須の説明文です。
- `body`（任意）: 変更の背景や理由を詳しく説明する本文です。
- `footer`（任意）: 関連する Issue 番号や `BREAKING CHANGE:` などの追加情報です。

## 種類

このプロジェクトで使用可能なコミットの種類は以下の通りです。

| タイプ | 説明 | Changelog見出し |
| --- | --- | --- |
| `feat` | 新機能 | Features |
| `fix` | バグ修正 | Bug Fixes |
| `docs` | ドキュメントのみの変更 | Documentation |
| `style` | コードの意味に影響しない変更（フォーマット、空白など） | Styling |
| `refactor` | バグ修正でも新機能でもないコード変更 | Refactoring |
| `perf` | パフォーマンスの改善 | Performance |
| `test` | テストの追加・修正 | Testing |
| `build` | ビルドシステムまたは外部依存の変更 | Build System |
| `ci` | CI設定・スクリプトの変更 | CI/CD |
| `chore` | その他の変更 | Chores |
| `revert` | コミットの取り消し | Reverts |

## スコープ

スコープは変更の対象範囲を示す任意の要素です。
`type` の直後に括弧で囲んで記述します。

```text
feat(api): add user endpoint
fix(ui): correct button alignment
```

スコープは省略可能です。
スコープを使用する場合は、短く具体的な名前を選び、プロジェクトで一貫して使用することを推奨します。

## Breaking Changes

破壊的変更を示す方法は2つあります。

1. `type` または `scope` の直後に `!` を追加します。

```text
feat!: drop support for Node.js 18
feat(api)!: change response format
```

2. フッターに `BREAKING CHANGE:` を追加します。

```text
feat: change default pagination size

BREAKING CHANGE: The default page size is now 20 instead of 10.
```

## 本文（ボディ）

本文の記述は **推奨** です（cocogitto による強制ではありません）。

- 件名と本文の間には空行を入れます。
- 変更の「なぜ」と「何を」を説明します。実装方法ではなく、目的や背景を書きます。
- 適切な長さで改行し、読みやすさを保ちます。

```text
feat(auth): add OAuth2 login

ユーザーが外部アカウントを使ってログインできるようにします。
これにより、パスワード管理の負担を減らし、認証フローを簡略化します。
```

## フッター

フッターの記述は **推奨** です（cocogitto による強制ではありません）。

フッターには以下の情報を記述できます。

- `BREAKING CHANGE:` で破壊的変更を説明します。
- 関連する Issue や Pull Request を参照します。

```text
fix(api): prevent duplicate orders

重複チェックを注文作成前に追加しました。

Closes #123
```

## 例

### 適切な例

```text
feat(auth): add password reset flow
```

```text
fix(ui): correct navigation alignment on mobile
```

```text
docs: update commit message conventions
```

```text
feat(api)!: change error response format
```

```text
refactor(service): simplify order calculation

複雑になっていた注文計算ロジックを整理し、保守性を向上します。

Closes #456
```

```text
feat: add feature
```

上記はスコープがなくても有効なコミットメッセージです。

### 不適切な例

```text
update stuff
```

上記は type が不足しているため、cocogitto によって却下されます。

```text
Feat: add feature
```

上記は type が大文字で始まっているため、大文字小文字を区別する cocogitto によって却下されます。

```text
feat:
```

上記は description が空のため、cocogitto によって却下されます。

## バリデーション

コミットメッセージの検証は `cog.toml` に設定された commit-msg hook で行われます。
hook 実行時には以下のコマンドが動作します。

```text
cog verify --file $1
```

このコマンドは、コミットメッセージが `cog.toml` に定義された規則に従っているかを確認します。
規則に違反するコミットは git hook によって自動的に拒否されます。
ルールの single source of truth は `cog.toml` です。

## 参考

- [Conventional Commits](https://www.conventionalcommits.org/)
- [cocogitto](https://github.com/cocogitto/cocogitto)
- `cog.toml`（プロジェクトルート）
- `docs/adr/20260519-cocogitto-commitlint.md`
