# ADR: GitHub Actions カスタムシェルによる Devbox CI 実行モデルの導入

- **Status:** Accepted
- **Date:** 2026-07-15

## Context

`docs/adr/20260713-devbox-canonical-toolchain.md` では、CI ステップを `devbox run -- pnpm ...` の形式で実行することを決定した。しかし、各ステップに `devbox run --` をつけ続けると以下のような運用上の問題が生じる。

- ステップごとにプレフィックスを書くため、ワークフローが冗長になり読みにくい
- 新規ステップ追加時にプレフィックスを忘れるリスクがある
- 環境変数の伝播やシェルオプションの扱いが、通常の `run` と異なる部分があり迷いやすい

一方、GitHub Actions では `defaults.run.shell` にカスタムシェルを指定できる。これを利用すれば、ジョブレベルで 1 度 Devbox 経由の bash を指定するだけで、各ステップは通常の `pnpm ...` のように記述できる。

## Decision

CI ジョブレベルでカスタムシェル `devbox run -- bash -e {0}` を宣言し、ステップ側の `devbox run --` プレフィックスを廃止する。

具体的な方針:

- `.github/workflows/ci.yml` の `defaults.run.shell` に `devbox run -- bash -e {0}` を設定する
- ステップでは `run: pnpm verify` や `run: pnpm build` など、Devbox プレフィックスなしで記述する
- GitHub Actions 上の Devbox CLI は `0.17.2` に固定する
- `devbox.json` の `shell.init_hook` は `./scripts/init-hook-guard.sh` を呼び出すのみとし、常に `scripts/setup.sh` を実行するのではなくコンテキストに応じてセットアップを行う

### init_hook のルーティング

`scripts/init-hook-guard.sh` は、以下の条件のいずれかを満たす場合のみ `scripts/setup.sh`（cocogitto commit-msg hook のインストール）を実行する。

1. **対話型シェル**: 標準入力が TTY の場合（`devbox shell` など）。ローカル開発者が Devbox 環境に入るときに hook をセットアップする。
2. **明示的なコンテキスト**: 環境変数 `COCOGITTO_INIT_HOOK` が設定されている場合。CI やスクリプト内で意図的に hook セットアップを発火させたいときに使用する。
3. **cocogitto コマンド直接実行時**: `devbox run cog` や `devbox run cog check` のように、`DEVBOX_RUN_CMD` が `cog` または `cog ` で始まる場合。Devbox 0.17.2 では内部変数 `DEVBOX_RUN_CMD` に実行対象のコマンドが設定されるため、これを判定に使用する。

それ以外の場合（例: `devbox run -- bash` 経由で実行される通常の CI ステップ）は、hook セットアップをスキップする。

### 通常の pnpm CI ステップがセットアップをスキップする理由

`pnpm install`、`pnpm verify`、`pnpm build` などの CI ステップは、カスタムシェル `devbox run -- bash -e {0}` 経由で実行される。これらのステップでは以下の条件に該当しないため、`init-hook-guard.sh` は `scripts/setup.sh` を呼ばない。

- 標準入力が TTY ではない
- `COCOGITTO_INIT_HOOK` が未設定
- `DEVBOX_RUN_CMD` は実行されるスクリプト本体ではなく `bash` になる

cocogitto hook のインストールはローカル開発のためのものであり、CI 上のビルドや検証ステップでは不要なため、このスキップは意図した動作である。

## Consequences

- ワークフローファイルの各 `run` ステップが簡潔になり、可読性が向上する
- 新規ステップ追加時に Devbox プレフィックスを意識する必要がなくなる
- Devbox 0.17.2 の `DEVBOX_RUN_CMD` の挙動に依存しており、Devbox のメジャー/マイナーアップグレード時には `init-hook-guard.sh` の動作確認が必要
- Devbox のバージョンを上げる際に `DEVBOX_RUN_CMD` の内部挙動が変わると、意図せず cocogitto のセットアップがスキップされる可能性がある
- `COCOGITTO_INIT_HOOK` による明示的なオプトイン経路を確保しているため、将来の挙動変更にも対応しやすい
- CI ステップで hook セットアップが走らないため、セットアップスクリプト内の対話的プロンプトが CI で誤って表示されることがなくなる
