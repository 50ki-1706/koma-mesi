/**
 * 初期設定ページのフォームと視覚表現を担当する。
 * 入力値の更新や送信処理は外部から受け取り、表示に専念する。
 */

import { PREFECTURES, WEEKDAYS } from "@/constants/initialSetup";
import type { InitialSetupFormController } from "@/hooks/useInitialSetup";
import { KomaMeshiLogo } from "@/shared/components/KomaMeshiMark/KomaMeshiLogo";
import { KomaMeshiMark } from "@/shared/components/KomaMeshiMark/KomaMeshiMark";

/**
 * 初期設定フォームを表示する。
 *
 * @param props - フォームの入力値と操作関数。
 * @returns 大学住所、昼休みの時間、曜日を入力するフォーム。
 */
export function InitialSetupForm({
  isInitialStatePending,
  isInitialSetupStatusError,
  isAuthenticated,
  userName,
  selectedDays,
  lunchTimeError,
  errorMessage,
  isSubmitting,
  handleGoogleSignIn,
  handleSignOut,
  toggleDay,
  handleSubmit,
}: InitialSetupFormController) {
  if (isInitialStatePending) {
    return (
      <main
        className="grid h-dvh place-items-center overflow-hidden bg-background"
        aria-busy="true"
      >
        <output
          className="size-9 animate-spin rounded-full border-4 border-brand-soft border-t-brand"
          aria-label="ログイン状態を確認しています"
        />
      </main>
    );
  }

  if (!isAuthenticated) {
    return <LoginPanel onGoogleSignIn={handleGoogleSignIn} />;
  }

  return (
    <main className="relative grid h-dvh overflow-hidden bg-background p-3 text-ink sm:p-6 lg:place-items-center lg:p-8">
      <div
        className="absolute -top-24 -left-24 size-64 rounded-full bg-brand-soft/70 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -right-24 -bottom-24 size-72 rounded-full bg-brand/15 blur-3xl"
        aria-hidden="true"
      />

      <section
        className="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[1.75rem] border border-line/80 bg-surface/95 shadow-[0_24px_80px_oklch(0.45_0.08_70/0.12)] lg:h-[min(800px,calc(100dvh-4rem))] lg:max-w-5xl"
        aria-labelledby="setup-title"
      >
        <header className="flex shrink-0 items-center gap-2 border-b border-line px-4 py-3 sm:px-6">
          <div
            className="grid size-8 shrink-0 place-items-center rounded-full bg-surface shadow-sm ring-1 ring-line"
            aria-hidden="true"
          >
            <KomaMeshiMark className="size-7" />
          </div>
          <p className="text-sm font-black tracking-tight sm:text-base">
            Koma Mesi
          </p>
          <p className="rounded-full bg-brand-soft px-2.5 py-1 text-[0.65rem] font-bold text-ink-muted sm:ml-2">
            初期設定
          </p>
          <button
            className="ml-auto rounded-full border border-line px-3 py-1.5 text-xs font-bold text-ink-muted transition hover:border-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            type="button"
            onClick={handleSignOut}
          >
            ログアウト
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[0.72fr_1.28fr]">
          <div className="shrink-0 bg-brand-soft/55 px-5 py-4 sm:px-8 lg:flex lg:flex-col lg:justify-center lg:px-10">
            <p className="mb-1 text-[0.65rem] font-black tracking-[0.22em] text-brand-hover">
              WELCOME
            </p>
            <h1
              className="text-xl leading-tight font-black tracking-tight sm:text-2xl lg:text-4xl lg:leading-[1.2]"
              id="setup-title"
            >
              あなたの大学生活を
              <br />
              教えてください
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted lg:mt-5 lg:text-sm">
              お昼休みにぴったりのお店を提案するために、
              <br className="hidden lg:block" />
              まずは普段のスケジュールを設定しましょう。
            </p>
            {userName !== null ? (
              <p className="mt-2 w-fit rounded-full bg-surface/80 px-3 py-1 text-xs font-bold text-ink lg:mt-5">
                {userName} さん
              </p>
            ) : null}
          </div>

          <form
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 [scrollbar-width:thin] [scrollbar-color:var(--color-line)_transparent] sm:px-8 sm:py-6 lg:px-10"
            onSubmit={handleSubmit}
          >
            {errorMessage !== null ? (
              <p
                className="mb-4 rounded-xl border border-brand/40 bg-brand-soft px-3 py-2 text-xs font-bold text-ink"
                role="alert"
              >
                {errorMessage}
              </p>
            ) : null}
            <fieldset>
              <legend className="flex items-center gap-2 text-sm font-black sm:text-base">
                <span className="grid size-6 place-items-center rounded-full bg-brand text-xs text-surface">
                  1
                </span>
                大学の住所
              </legend>
              <p className="mt-1 text-xs text-ink-muted">
                普段通っているキャンパスの住所を入力してください。
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-xs font-bold">
                  <span>郵便番号</span>
                  <span className="relative">
                    <svg
                      className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 fill-none stroke-ink-muted stroke-[1.8]"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M12 21s7-5.2 7-12A7 7 0 1 0 5 9c0 6.8 7 12 7 12Z" />
                      <circle cx="12" cy="9" r="2.3" />
                    </svg>
                    <input
                      className="h-10 w-full rounded-xl border border-line bg-surface-muted/45 pr-3 pl-9 text-sm outline-none transition placeholder:text-ink-muted/60 focus:border-brand focus:ring-2 focus:ring-brand-soft"
                      name="postalCode"
                      type="text"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="123-4567"
                      pattern="[0-9]{3}-[0-9]{4}"
                      title="半角数字とハイフンで入力してください（例：123-4567）"
                      required
                    />
                  </span>
                </label>

                <label className="grid gap-1 text-xs font-bold">
                  <span>都道府県</span>
                  <span>
                    <select
                      className="h-10 w-full rounded-xl border border-line bg-surface-muted/45 px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-soft"
                      name="prefecture"
                      defaultValue=""
                      required
                    >
                      <option value="" disabled>
                        選択してください
                      </option>
                      {PREFECTURES.map((prefecture) => (
                        <option key={prefecture} value={prefecture}>
                          {prefecture}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>

                <label className="col-span-2 grid gap-1 text-xs font-bold">
                  <span>市区町村・番地</span>
                  <input
                    className="h-10 rounded-xl border border-line bg-surface-muted/45 px-3 text-sm outline-none transition placeholder:text-ink-muted/60 focus:border-brand focus:ring-2 focus:ring-brand-soft"
                    name="streetAddress"
                    type="text"
                    autoComplete="address-line1"
                    placeholder="例：新宿区西新宿 1-2-3"
                    minLength={3}
                    required
                  />
                </label>
              </div>
            </fieldset>

            <div className="my-4 h-px bg-line sm:my-5" />

            <fieldset>
              <legend className="flex items-center gap-2 text-sm font-black sm:text-base">
                <span className="grid size-6 place-items-center rounded-full bg-brand text-xs text-surface">
                  2
                </span>
                昼休みの時間
              </legend>
              <p className="mt-1 text-xs text-ink-muted">
                授業がある日の昼休みの開始時刻と終了時刻を入力してください。
              </p>
              <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                <label className="grid gap-1 text-xs font-bold">
                  <span>開始時刻</span>
                  <input
                    className={`h-10 min-w-0 rounded-xl border bg-surface-muted/45 px-3 text-sm outline-none transition focus:ring-2 ${
                      lunchTimeError !== null
                        ? "border-danger focus:border-danger focus:ring-danger/20"
                        : "border-line focus:border-brand focus:ring-brand-soft"
                    }`}
                    name="lunchStartTime"
                    type="time"
                    aria-invalid={lunchTimeError !== null}
                    aria-describedby={
                      lunchTimeError !== null ? "lunch-time-error" : undefined
                    }
                    required
                  />
                </label>
                <span
                  className="pb-2.5 text-xs font-bold text-ink-muted"
                  aria-hidden="true"
                >
                  〜
                </span>
                <label className="grid gap-1 text-xs font-bold">
                  <span>終了時刻</span>
                  <input
                    className={`h-10 min-w-0 rounded-xl border bg-surface-muted/45 px-3 text-sm outline-none transition focus:ring-2 ${
                      lunchTimeError !== null
                        ? "border-danger focus:border-danger focus:ring-danger/20"
                        : "border-line focus:border-brand focus:ring-brand-soft"
                    }`}
                    name="lunchEndTime"
                    type="time"
                    aria-invalid={lunchTimeError !== null}
                    aria-describedby={
                      lunchTimeError !== null ? "lunch-time-error" : undefined
                    }
                    required
                  />
                </label>
              </div>
              {lunchTimeError !== null ? (
                <p
                  className="mt-2 text-xs font-bold text-danger"
                  id="lunch-time-error"
                  role="alert"
                >
                  {lunchTimeError}
                </p>
              ) : null}
            </fieldset>

            <div className="my-4 h-px bg-line sm:my-5" />

            <fieldset>
              <legend className="flex items-center gap-2 text-sm font-black sm:text-base">
                <span className="grid size-6 place-items-center rounded-full bg-brand text-xs text-surface">
                  3
                </span>
                ご飯を食べる曜日
              </legend>
              <p className="mt-1 text-xs text-ink-muted">
                昼休みに大学周辺でご飯を食べる曜日を選んでください。
              </p>
              <div className="mt-3 grid grid-cols-5 gap-1.5">
                {WEEKDAYS.map((day) => (
                  <label
                    className="group relative grid cursor-pointer place-items-center"
                    key={day.value}
                  >
                    <input
                      className="peer sr-only"
                      type="checkbox"
                      name="lunchDays"
                      value={day.value}
                      checked={selectedDays.includes(day.value)}
                      onChange={() => toggleDay(day.value)}
                    />
                    <span className="w-full rounded-xl border border-line bg-surface py-2 text-center text-[0.65rem] font-bold text-ink-muted transition group-hover:border-brand peer-checked:border-brand peer-checked:bg-brand-soft peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus sm:text-xs">
                      {day.label.slice(0, 1)}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="sticky bottom-0 -mx-1 mt-5 bg-surface/95 px-1 pt-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
              <button
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-black text-ink shadow-[0_8px_20px_oklch(0.65_0.15_75/0.22)] transition hover:bg-brand-hover hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                type="submit"
                disabled={
                  selectedDays.length === 0 ||
                  isInitialSetupStatusError ||
                  isInitialStatePending ||
                  isSubmitting
                }
              >
                {isSubmitting ? "設定を保存しています…" : "設定を完了する"}
                <svg
                  className="size-4 fill-none stroke-current stroke-2"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="m7.5 4.5 5.5 5.5-5.5 5.5" />
                </svg>
              </button>
              <p className="mt-1.5 text-center text-[0.65rem] text-ink-muted">
                設定はあとからマイページで変更できます
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

interface LoginPanelProps {
  onGoogleSignIn: () => void;
}

/**
 * 初期設定へ進む前に必要なGoogleログイン画面を表示する。
 *
 * @param props - Googleログインを開始する操作。
 * @returns Googleログインボタンを含む案内画面。
 */
function LoginPanel({ onGoogleSignIn }: LoginPanelProps) {
  return (
    <main className="relative grid h-dvh place-items-center overflow-hidden bg-background p-5 text-ink">
      <div
        className="absolute -top-20 -left-20 size-64 rounded-full bg-brand-soft blur-3xl"
        aria-hidden="true"
      />
      <section
        className="relative w-full max-w-sm rounded-[2rem] border border-line bg-surface/95 px-7 py-8 text-center shadow-[0_24px_80px_oklch(0.45_0.08_70/0.14)] sm:px-10"
        aria-labelledby="login-title"
      >
        <div className="mx-auto w-28" role="img" aria-label="Koma Mesi">
          <KomaMeshiLogo className="w-full" />
        </div>
        <p className="mt-5 text-[0.65rem] font-black tracking-[0.22em] text-brand-hover">
          WELCOME
        </p>
        <h1
          className="mt-1 text-2xl leading-tight font-black tracking-tight"
          id="login-title"
        >
          大学のランチを、
          <br />
          もっと楽しもう。
        </h1>
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">
          あなたの授業スケジュールに合わせて、
          <br />
          昼休みにぴったりのお店を見つけます。
        </p>
        <button
          className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-line bg-surface text-sm font-bold shadow-sm transition hover:border-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:scale-[0.99]"
          type="button"
          onClick={onGoogleSignIn}
        >
          <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="oklch(0.62 0.2 29)"
              d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4Z"
            />
            <path
              fill="oklch(0.7 0.16 145)"
              d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1a5.8 5.8 0 0 1-5.4-4H3.3v2.6A10 10 0 0 0 12 22Z"
            />
            <path
              fill="oklch(0.82 0.16 86)"
              d="M6.6 14.1a6 6 0 0 1 0-4.2V7.3H3.3a10 10 0 0 0 0 9.4l3.3-2.6Z"
            />
            <path
              fill="oklch(0.62 0.19 253)"
              d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 12 2a10 10 0 0 0-8.7 5.3l3.3 2.6a5.8 5.8 0 0 1 5.4-4Z"
            />
          </svg>
          Google でログイン
        </button>
        <p className="mt-3 text-[0.65rem] text-ink-muted">
          ログイン後、大学と昼休みの情報を設定します。
        </p>
      </section>
    </main>
  );
}
