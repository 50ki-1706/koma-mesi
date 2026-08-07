# コミットメッセージの運用

このドキュメントは、このプロジェクトでコミットメッセージを**どう運用するか**をまとめたものです。形式の詳細は [Conventional Commits](https://www.conventionalcommits.org/)、検証ルールは [`cog.toml`](../cog.toml) がそれぞれソースオブトゥルースです。

## 概要

このプロジェクトでは [Conventional Commits](https://www.conventionalcommits.org/) に従ったコミットメッセージを使い、コミット時に [cocogitto](https://github.com/cocogitto/cocogitto) の `commit-msg` hook が自動で検証します。ここでは、コミットの単位・タイミング、タイプやスコープの選び方、本文やフッターの書き方、そしてコミットが changelog や PR にどう関係するかを中心に説明します。

## コミットのワークフロー

### 1つのコミットには1つの論理的な変更を入れる

レビューしやすく、後から取り消しや cherry-pick しやすくするため、コミットは小さく論理的な単位に分けます。

- 良い: `feat(auth): add Google OAuth login`, `fix(ui): correct mobile menu layout`
- 避ける: 1つのコミットに認証追加と UI 修正とリファクタリングを混ぜる

### コミットのタイミング

以下のような「意味のある作業単位」が完了したらコミットします。

- 1つの機能やバグ修正が完成した
- テストが通る状態になった
- レビュー依頼前に整理したい段階

細かすぎても整理が大変ですが、大きすぎるとレビューや revert が困難になります。

### WIP コミットは残さない

作業中の一時保存は `git commit --amend` や `git rebase -i HEAD~n` で整理してください。PR 提出前には WIP や `tmp` のようなコミットを削除または整理します。

```bash
git commit --amend
git rebase -i HEAD~n
```

### 複数スコープにまたがる変更は分離する

API と UI の両方を変更する場合は、可能な限り分けてコミットします。

```text
feat(api): add user list endpoint
feat(ui): add user list page
```

どうしても同じコミットに含める必要がある場合は、スコープを省略するか、最も影響の大きいスコープを選びます。

## タイプとスコープの選び方

### タイプの早見表

完全な定義は [`cog.toml`](../cog.toml) を確認してください。

| タイプ | 使う場面 | このプロジェクトでの例 |
| --- | --- | --- |
| `feat` | 新機能追加 | `feat(auth): add OAuth callback handler` |
| `fix` | バグ修正 | `fix(ui): prevent layout shift on navigation` |
| `docs` | ドキュメントのみの変更 | `docs: update commit message conventions` |
| `style` | フォーマット、空白、セミコロンなど | `style: format with Biome` |
| `refactor` | 動作は変えずコードを整理 | `refactor(db): extract user queries to repository` |
| `perf` | パフォーマンス改善 | `perf(api): cache user session lookup` |
| `test` | テスト追加・修正 | `test(auth): add OAuth error cases` |
| `build` | ビルドや依存関係の変更 | `build: update Next.js to 16.3` |
| `ci` | CI 設定の変更 | `ci: add typecheck to GitHub Actions` |
| `chore` | その他の雑多な変更 | `chore: update .env.local.example` |
| `revert` | コミットの取り消し | `revert: feat(auth): add OAuth callback handler` |

### スコープの選び方

スコープは変更が属するモジュールや機能を短く表します。一貫性を保つため、`auth`, `api`, `ui`, `db`, `storybook`, `deps` やプロジェクト固有のドメイン名（例: `order`, `user`）を使うことを推奨します。不明確な場合は省略しても問題ありません。

```text
feat(api): add user list endpoint
fix(ui): correct button alignment on mobile
```

## 本文とフッターの書き方

### 本文には「なぜ」を書く

diff には「何を変更したか」が含まれるため、本文では「なぜその変更が必要だったか」「どういう判断をしたか」を書きます。複雑なロジック、非自明な実装選択、既存挙動の変更、パフォーマンス改善の背景など、レビューアーに文脈を伝えたい場合に本文を書きます。

```text
feat(api): add rate limiting to public endpoints

公開エンドポイントへの過剰なリクエストを防ぐため、Redis を使った
レート制限を追加します。認証エンドポイントには影響を与えず、
匿名ユーザー向けのエンドポイントのみを対象としています。
```

### フッターには関連情報を書く

Issue や PR との関連、破壊的変更の説明をフッターに書きます。

```text
fix(api): prevent duplicate orders

注文作成前に冪等性キーによる重複チェックを追加しました。

Closes #123
Refs #456
```

### 破壊的変更の扱い

破壊的変更を入れる場合は `!` か `BREAKING CHANGE:` で明示します。可能であれば独立したコミットにし、マイグレーション方法を本文に書いてください。

```text
feat(api)!: change error response format
feat(api): change default pagination size
BREAKING CHANGE: デフォルトの1ページあたり件数を 10 から 20 に変更します。
```

## コミット時の動作

コミット時に `commit-msg` hook が自動で `cog verify --file $1` を実行します。メッセージが [`cog.toml`](../cog.toml) のルールに違反している場合、コミットは拒否されます。

```text
$ git commit -m "update stuff"
Error: Missing commit type
```

拒否された場合はメッセージを修正して再度コミットしてください。事前確認は以下のコマンドで行えます。

```bash
cog verify "feat(auth): add Google OAuth login"
```

hook は `scripts/setup.sh` で一度だけインストールします。リポジトリのセットアップ時に既に実行されているはずです。

## コミットと PR・チェンジログの関係

### PR には整ったコミットを含める

PR を出す前にコミット履歴を整理し、WIP コミットが残っていないこと、各コミットが論理的な単位になっていること、コミットメッセージから変更の意図が読み取れることを確認してください。

### コミットが changelog を自動生成する

このプロジェクトでは cocogitto がコミットから changelog を生成します。`feat` は Features セクション、`fix` は Bug Fixes セクションに配置され、他のタイプも [`cog.toml`](../cog.toml) の `changelog_title` に従って分類されます。`feat` や `fix` のメッセージは直接ユーザー向け changelog に載るため、特に分かりやすく書いてください。

### 破壊的変更は目立つ位置に表示される

`!` や `BREAKING CHANGE:` でマークされたコミットは、changelog に強調されて表示されます。マイグレーションに必要な情報は必ず含めてください。

### squash merge

PR を squash merge する場合、PR タイトルが最終的なコミットメッセージになります。PR タイトルも Conventional Commits の形式に合わせてください。

```text
feat(auth): add Google OAuth login
```

## フォーマット早見表

### 基本の形

```text
<type>[optional scope][!]: <description>

[optional body]

[optional footer(s)]
```

完全な仕様は [Conventional Commits](https://www.conventionalcommits.org/) を参照してください。

### 良い例

```text
feat(auth): add Google OAuth login
fix(ui): correct navigation alignment on mobile
refactor(db): extract user queries to repository

重複していたユーザー関連のクエリを repository パターンに統一し、
テスト容易性と保守性を向上します。

Refs #456
```

### 悪い例

```text
update stuff
```

タイプがないため拒否されます。

```text
feat: fix bug
```

タイプと内容が矛盾しています。`fix` を使うべき場面です。

## 参考

- [Conventional Commits](https://www.conventionalcommits.org/)
- [cocogitto](https://github.com/cocogitto/cocogitto)
- [`cog.toml`](../cog.toml)
- [ADR: cocogitto によるコミットメッセージ検証](../docs/adr/20260519-cocogitto-commitlint.md)
