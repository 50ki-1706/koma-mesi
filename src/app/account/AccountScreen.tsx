/**
 * 住所・昼休み・曜日の確認場所となるアカウント画面を描画する。
 * 状態と操作はアカウント用カスタムフックへ委譲する。
 */

"use client";

import Link from "next/link";
import { useAccount } from "@/hooks/useAccount";

/**
 * アカウント情報とログアウト操作を表示する。
 *
 * @returns 認証状態に応じたアカウント画面。
 */
export function AccountScreen() {
  const { isPending, isAuthenticated, userName, userEmail, handleSignOut } =
    useAccount();

  if (isPending) {
    return (
      <main
        className="grid h-dvh place-items-center bg-background"
        aria-busy="true"
      >
        <output
          className="size-9 animate-spin rounded-full border-4 border-brand-soft border-t-brand"
          aria-label="アカウント情報を読み込んでいます"
        />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background p-6 text-center text-ink">
        <section className="w-full max-w-sm rounded-[1.75rem] border border-line bg-surface p-7 shadow-[0_24px_80px_oklch(0.45_0.08_70/0.12)]">
          <h1 className="text-xl font-black">ログインが必要です</h1>
          <p className="mt-2 text-sm text-ink-muted">
            アカウント情報を確認するにはログインしてください。
          </p>
          <Link
            className="mt-6 flex h-11 items-center justify-center rounded-xl bg-brand text-sm font-black transition hover:bg-brand-hover hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            href="/"
          >
            ログイン画面へ
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-6 text-ink sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[0.65rem] font-black tracking-[0.22em] text-brand-hover">
              ACCOUNT
            </p>
            <h1 className="text-2xl font-black tracking-tight">アカウント</h1>
          </div>
          <Link
            className="rounded-full border border-line bg-surface px-4 py-2 text-xs font-bold text-ink-muted transition hover:border-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            href="/recommendations"
          >
            おすすめへ戻る
          </Link>
        </header>

        <section
          className="mt-6 rounded-[1.75rem] border border-line bg-surface p-5 shadow-[0_18px_60px_oklch(0.45_0.08_70/0.1)] sm:p-7"
          aria-labelledby="profile-title"
        >
          <p className="text-xs font-bold text-ink-muted" id="profile-title">
            ログイン中のアカウント
          </p>
          <p className="mt-2 text-lg font-black">{userName ?? "ユーザー"}</p>
          {userEmail !== null ? (
            <p className="mt-1 text-sm text-ink-muted">{userEmail}</p>
          ) : null}
        </section>

        <section
          className="mt-4 rounded-[1.75rem] border border-line bg-surface p-5 sm:p-7"
          aria-labelledby="setup-details-title"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-black" id="setup-details-title">
              初期設定
            </h2>
            <span className="rounded-full bg-brand-soft px-3 py-1 text-[0.65rem] font-bold text-ink-muted">
              登録内容
            </span>
          </div>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <AccountDetail label="大学の住所" wide />
            <AccountDetail label="昼休みの時間" />
            <AccountDetail label="ご飯を食べる曜日" />
          </dl>
        </section>

        <button
          className="mt-6 h-11 w-full rounded-xl border border-line bg-surface text-sm font-black text-ink-muted transition hover:border-brand-hover hover:bg-brand-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          type="button"
          onClick={handleSignOut}
        >
          ログアウト
        </button>
      </div>
    </main>
  );
}

interface AccountDetailProps {
  label: string;
  wide?: boolean;
}

/** アカウント情報の見出しと値を表示する。 */
function AccountDetail({ label, wide = false }: AccountDetailProps) {
  return (
    <div
      className={`rounded-2xl bg-surface-muted p-4 ${wide ? "sm:col-span-2" : ""}`}
    >
      <dt className="text-xs font-bold text-ink-muted">{label}</dt>
      <dd className="mt-1.5 text-sm font-black leading-relaxed text-ink-muted">
        設定内容をここに表示します
      </dd>
    </div>
  );
}
