# ブランチ命名規則

このドキュメントは、人が作成する作業ブランチの命名規則を定めます。ブランチ名から作業の種類と目的を判断できる状態を保ち、検索や自動化をしやすくすることが目的です。

## 基本形式

GitHub Issue に紐づく作業では、Issue 番号を含めます。

```text
<種類>/<Issue番号>-<説明>
```

Issue に紐づかない作業では、番号を省略します。存在しない Issue 番号を作ってはいけません。

```text
<種類>/<説明>
```

## 種類

| プレフィックス | 用途 |
| --- | --- |
| `feature/` | 新機能の追加 |
| `fix/` | 通常の不具合修正 |
| `hotfix/` | 本番環境に対する緊急修正 |
| `release/` | リリース準備 |
| `docs/` | ドキュメントやエージェント向け指示の更新 |
| `refactor/` | 外部仕様を変えないコード改善 |
| `test/` | テストのみの追加・修正 |
| `chore/` | 依存関係更新や設定変更などの保守作業 |

複数の種類に見える場合は、変更ファイルではなく主な成果で判断し、最も具体的な種類を1つ選びます。

## 説明の書き方

- 英小文字、数字、ハイフンのみを使う
- ケバブケースで記述する
- `add`、`fix`、`update`、`remove`、`prevent`、`extract` など、具体的な動詞から始める
- 50文字以内を目安に、作業内容を具体的かつ簡潔に表す
- 先頭・末尾のハイフンや、連続するハイフンを使わない
- スペース、アンダースコア、日本語、その他の特殊文字を使わない

## 例

適切な名前:

```text
feature/123-add-user-authentication
fix/456-prevent-duplicate-orders
docs/define-branch-naming-rules
chore/update-dependencies
release/prepare-v1-2-0
```

避ける名前:

| ブランチ名 | 理由 |
| --- | --- |
| `feature/update` | 何を更新するのか分からない |
| `feature/add-new-user-authentication-flow-with-google-and-facebook-login` | 長すぎる |
| `feature/ユーザー認証を追加` | 日本語を含む |
| `feature/add user-authentication` | スペースを含む |
| `feature/add_user-authentication` | アンダースコアを含む |

## 作成手順

1. 作業の主な成果から種類を選ぶ。
2. 関連する GitHub Issue があれば、その番号を確認する。
3. 作業を表す短い英語の説明をケバブケースで作る。
4. 規則と照合してから、`git switch -c <ブランチ名>` で作成する。

## 適用範囲と例外

- この規則は、規則導入後に人が作成する作業ブランチに適用する。
- `main` などの長期運用ブランチには適用しない。
- Dependabot などの外部ツールが自動生成するブランチには適用しない。
- 既存ブランチは、必要がない限り改名しない。

## エージェントでの利用

エージェントがブランチ名を提案・検証・作成するときは、`$name-branches` Skill を使用します。規則の正本はこのドキュメントであり、Skill と内容が食い違う場合はこのドキュメントを優先します。

## 参考

- [ブランチ命名規則 | GitHub完全ガイド](https://neuve.com/how-to-use-github/13-branch-naming/)
