// Next.jsの設定と、ビルド時に必要な環境変数の初期化を定義するファイルです。
// 本番ビルド時のみ、未設定の認証関連環境変数へダミー値を注入します。
import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

export default (phase: string): NextConfig => {
  // ビルド時にGoogle Auth関連の環境変数が未設定だと、モジュール評価時に
  // resolveAuthCredentials()がthrowするため、ダミー値でビルドエラーを回避します。
  if (phase === PHASE_PRODUCTION_BUILD) {
    if (!process.env.GOOGLE_CLIENT_ID?.trim()) {
      process.env.GOOGLE_CLIENT_ID = "dummy-google-client-id-for-build";
    }
    if (!process.env.GOOGLE_CLIENT_SECRET?.trim()) {
      process.env.GOOGLE_CLIENT_SECRET = "dummy-google-client-secret-for-build";
    }
    if (!process.env.OAUTH_PROXY_SECRET?.trim()) {
      process.env.OAUTH_PROXY_SECRET = "dummy-oauth-proxy-secret-for-build";
    }
    if (!process.env.AUTH_PRODUCTION_URL?.trim()) {
      process.env.AUTH_PRODUCTION_URL = "http://localhost:3000";
    }
    if (!process.env.AUTH_ALLOWED_HOSTS?.trim()) {
      process.env.AUTH_ALLOWED_HOSTS = "localhost";
    }
  }

  const nextConfig: NextConfig = {
    /* config options here */
    reactCompiler: true,
  };

  return nextConfig;
};
