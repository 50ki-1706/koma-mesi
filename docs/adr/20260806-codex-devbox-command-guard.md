# ADR: AI Agent の開発コマンドを Devbox に統一する

- **Status:** Accepted
- **Date:** 2026-08-06

## Context

`docs/adr/20260713-devbox-canonical-toolchain.md` では、Devbox をチーム開発における標準の開発環境（canonical development environment）として採用した。`devbox.json` と `devbox.lock` で Node.js、pnpm、cocogitto などの開発ツールとそのバージョンを管理し、開発者、AI Agent、CI が同じツールチェーンを使用することで再現性を保つ方針である。

一方、指示文だけでは AI Agent が Host OS の `PATH` にある `node` や `pnpm` を誤って直接実行する可能性がある。Host OS 側のバージョンを使用すると、開発者や Agent ごとに実行結果が異なったり、ローカルでは成功しても CI では失敗したりする原因になる。

また、コマンドの先頭だけを Devbox 経由にしても、`devbox run -- pnpm verify; pnpm build` のようなコマンド連結、パイプ、リダイレクト、変数展開、コマンド置換が外側のシェルで評価されると、コマンドの一部が Devbox の外側で実行される。複雑なシェル構文は、Devbox 内側のシェルに渡す必要がある。

この仕組みの目的は、通常の開発コマンドの実行経路を Devbox に統一することである。Host OS 上の任意の実行ファイルを技術的に実行不能にすることや、Devbox をセキュリティ境界として使用することは目的としない。

## Decision

AI Agent がこのリポジトリで通常の開発コマンドを実行するときは、`devbox run -- <command>` または `devbox shell` を標準の実行経路とし、Devbox が管理するツールチェーンを使用する。

Codex、Claude Code、OpenCode には、次のプロジェクトローカル設定を適用する。

- Codex は `.codex/hooks.json` の `PreToolUse` フックから `.codex/hooks/require-devbox.mjs` を呼び出す
- Claude Code は `CLAUDE.md` から `AGENTS.md` を読み込み、`.claude/settings.json` の `PreToolUse` フックから同じコマンド判定を呼び出す
- OpenCode は `AGENTS.md` を指示として使用し、`opencode.json` の権限設定と `.opencode/plugins/require-devbox.js` の `tool.execute.before` から同じコマンド判定を呼び出す

共有するコマンド判定は、以下を満たすコマンドだけを許可する。

- コマンドの最外層が `devbox run --` または `devbox shell` である
- Devbox の外側に、コマンド連結、パイプ、リダイレクト、変数展開、コマンド置換など、外側のシェルで評価される構文がない
- 複雑なシェル構文は、`devbox run -- sh -lc 'pnpm typecheck; pnpm check'` のように引用符で保護し、Devbox 内側のシェルへ渡す

Devbox 経由でないコマンドや不正なフック入力は実行前に拒否し、`devbox run -- <command>` または `devbox shell` を使うよう案内する。ガード自身も Devbox 経由で起動する。

`apply_patch` などファイルの読み書きに特化した Agent ツールは、開発ツールチェーンを実行するプロセスではないため対象外とする。編集後のフォーマット、生成、テスト、ビルドなどは対象とする。

## Consequences

- 開発者、AI Agent、CI が、Devbox で解決された同じ Node.js、pnpm、その他の開発ツールとバージョンを使用しやすくなる
- AI Agent が Host OS にインストールされた `node` や `pnpm` を誤って直接実行することを、プロジェクトローカルのガードで防止できる
- コマンド連結、パイプ、リダイレクト、展開などが必要な場合は、その処理を Devbox 内側のシェルで評価する必要がある
- Codex、Claude Code、OpenCode が同じ Devbox ポリシーとコマンド判定を共有するため、Agent 間の実行環境差と判定ロジックの重複を減らせる
- プロジェクトローカルのフックや設定を有効にするには、各 Agent で project trust や設定の読み込みが必要になる場合がある
- このガードは OS レベルの sandbox または security boundary ではなく、Host OS 上のあらゆるバイナリを実行不能にする保証はない
- `devbox run -- /usr/bin/...` のように絶対パスで指定された Host OS の任意のバイナリまで禁止するものではなく、Devbox 内側で実行するコマンド内容を完全には制限しない
- プロジェクト設定やガード自体を無効化できる利用者に対して、強制不能なセキュリティ境界を提供するものではない

## References

- [Claude Code: Hooks reference](https://code.claude.com/docs/en/hooks)
- [Claude Code: Project instructions](https://code.claude.com/docs/en/memory)
- [OpenCode: Rules](https://opencode.ai/docs/rules/)
- [OpenCode: Plugins](https://opencode.ai/docs/plugins/)
- [OpenCode: Permissions](https://opencode.ai/docs/permissions)
