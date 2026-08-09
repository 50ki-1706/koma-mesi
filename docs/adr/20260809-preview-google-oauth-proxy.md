# Preview環境のGoogle OAuthを本番URL経由で処理する

## ステータス

採用

## 背景

VercelのPreview Deployment URLはデプロイやブランチによって変化する。一方、Google OAuthの承認済みリダイレクトURIは完全一致が必要で、ワイルドカードを使用できない。そのため、個々のPreview URLをGoogle Cloud Consoleへ都度登録する運用は不安定で、設定漏れも起こりやすい。

また、Preview環境は本番とは異なるTursoデータベースを使用しており、ログイン完了後のユーザーとセッションはPreview側へ保存する必要がある。

## 決定

Better AuthのOAuth Proxyプラグインを使用し、`AUTH_PRODUCTION_URL`で指定した固定の本番URLをGoogle OAuthのコールバック先とする。

- Google Cloud Consoleには本番URLの `/api/auth/callback/google` のみを登録する。
- Better Authの動的Base URLで、`AUTH_ALLOWED_HOSTS`に設定したローカル、本番、Previewホストを許可する。
- 公開情報を含むURLとホストパターンも環境変数で管理する。
- `OAUTH_PROXY_SECRET`を本番、Preview、ローカルで共有し、OAuth Proxyが受け渡すプロフィール情報の暗号化に使用する。
- `BETTER_AUTH_SECRET`とデータベースは環境ごとに分離したままとする。

## 結果

- Preview URLが変化してもGoogle Cloud ConsoleのリダイレクトURIを追加する必要がない。
- Googleからのコールバックは本番を経由するが、ユーザーとセッションはログインを開始したPreview環境のデータベースへ保存される。
- 本番環境がGoogleから到達可能である必要がある。
- `OAUTH_PROXY_SECRET`が環境間で一致しない場合、OAuth stateの検証に失敗する。

## 参考

- [Better Auth OAuth Proxy](https://better-auth.com/docs/plugins/oauth-proxy)
- [Better Auth Dynamic Base URL](https://better-auth.com/docs/guides/dynamic-base-url)
- [Google OAuth 2.0 redirect URI validation](https://developers.google.com/identity/protocols/oauth2/web-server)
