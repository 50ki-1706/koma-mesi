<!-- BEGIN:common-agent-rules -->
- KISS, DRY, YAGNI を守る
- コロケーションを重視すること

## Devbox 実行ポリシー

- Devbox を、チームメンバー、AI Agent、CI が共有する標準の開発環境（canonical development environment）とする。`devbox.json` と `devbox.lock` で固定された Node.js、pnpm、その他の開発ツールを使用し、実行環境の差異を防ぐことが目的である。
- AI Agent が通常の開発コマンドを実行するときは、必ず Devbox を経由すること。非対話実行は `devbox run -- <command>`、継続的な対話操作は `devbox shell` を使用すること。
- ホスト環境から `node`、`pnpm`、`npx`、`cog`、データベース CLI、リポジトリ内スクリプトなどの開発ツールを直接実行しないこと。`node --version` などのバージョン確認も Devbox 経由で実行すること。
- パイプ、リダイレクト、コマンド連結、変数展開、コマンド置換などを Devbox の外側で評価させないこと。複雑なシェル構文が必要な場合は、`devbox run -- sh -lc 'pnpm typecheck; pnpm check'` のように Devbox 内側のシェルへ渡すこと。
- ファイルの読み書きに特化した Agent ツールはプロセス実行ではないため対象外とする。ただし、編集後のフォーマット、生成、検証などのコマンドは必ず Devbox 経由で実行すること。
- Codex は `.codex/hooks.json`、Claude Code は `.claude/settings.json`、OpenCode は `opencode.json` と `.opencode/plugins/require-devbox.js` のワークフローガードにより、通常の開発コマンドを Devbox 経由の実行経路へ統一する。拒否された場合は、Devbox 経由のコマンドとして再実行すること。
- これらのガードは OS レベルの sandbox や security boundary ではなく、絶対パスで指定された Host OS 上の任意のバイナリまで実行不能にするものではない。ガードを無効化または弱体化せず、開発ツールチェーンを統一するためのルールとして使用すること。

- docs/以下にドキュメントがあるので必要なときに参照すること。ファイル名で判断すること。追加するときはファイル名をわかりやすくつけること。
- ADRを書くこと（docs/adr以下に）。設計上の重要な判断をしたときは必ず書くこと。書くべきか迷う場合はユーザーに確認すること。append-onlyで、過去の内容は変更しないこと。
- フロントエンドはテストコードを書かないでください。
- バックエンドはテストコードを書いてください。
- コードを実装した後は、必ず`verify`スキルを使用してコードが正しく動作し、必要な基準を満たしていることを確認してください。
- スクリプトを実行する際は`&&`は使用せず、1つずつ実行してください。
- 定数は`src/constants/`以下に定義してください。
- 共通の処理は、`src/shared/`以下に定義してください.

## 許可スクリプト
スクリプトはpackage.jsonに書かれているものだけ使用してください。これにより、プロジェクトの一貫性が保たれ、予期しない問題を防ぐことができます。
- `devbox run -- pnpm dev`: 開発サーバーを起動します。
- `devbox run -- pnpm build`: プロジェクトをビルドします。
- `devbox run -- pnpm start`: ビルドされたプロジェクトを起動します。
- `devbox run -- pnpm check`: コードの品質を確認します。(Biome)
- `devbox run -- pnpm format`: コードをフォーマットします。(Biome)
- `devbox run -- pnpm typecheck`: 型チェックを実行します。
- `devbox run -- pnpm test:run`: テストを実行します。(vitest)
- `devbox run -- pnpm build-storybook`: Storybookをビルドします。
- `devbox run -- pnpm db:generate`: Drizzle ORMのコードを生成します。
- `devbox run -- pnpm db:migrate`: データベースのマイグレーションを実行します。
- `devbox run -- pnpm db:push`: データベースのマイグレーションを適用します。
- `devbox run -- pnpm db:reset`: データベースをリセットします。
- `devbox run -- pnpm verify:frontend`: フロントエンドコードの変更に対して、型チェックとコード品質の確認を実行します。
- `devbox run -- pnpm verify`: アプリケーションコードの変更に対して、型チェック、テストの実行、コード品質の確認を実行します。
<!-- END:common-agent-rules -->

<!-- BEGIN:design-agent-rules -->
- 絵文字は使用しないこと
- デザイントークンを定義すること、Tailwind デフォルトカラーは使わない、既存トークンとのトンマナを考えて自前で色を作る、oklchを使うこと
- UIは視線の流れを意識すること
<!-- END:design-agent-rules -->

<!-- BEGIN:typescript-agent-rules -->
- any型を使用しないこと
- unknown型を使用して、必要に応じて型ガードを実装すること
- TSDoc を書くこと（ts, tsxともに必須。@param, @returnsなど）
- すべての .ts / .tsx ファイルの冒頭に、そのファイルの役割・責務を2行程度で記述する、
<!-- END:typescript-agent-rules -->
- 各ページのエントリファイル(page.tsx)には、ロジックを直接書かず。`src/hooks/`以下にカスタムフックを作製すること。
- 共通のUIコンポーネントは、`src/shared/components/`以下に作成すること。
<!-- BEGIN:react-agent-rules -->
- 
<!-- END:react-agent-rules -->
<!-- BEGIN:nextjs-agent-rules -->
 
# Next.js: ALWAYS read docs before coding
 
Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.
 
- APIは、Controller,Service.Repository,Modelの4層を意識して書くこと。
<!-- END:nextjs-agent-rules -->
