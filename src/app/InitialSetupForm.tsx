/**
 * 初期設定ページのフォームと視覚表現を担当する。
 * 入力値の更新や送信処理は外部から受け取り、表示に専念する。
 */

import {
  LUNCH_TIME_OPTIONS,
  PREFECTURES,
  WEEKDAYS,
} from "@/constants/initialSetup";
import type { InitialSetupFormController } from "@/hooks/useInitialSetup";

/**
 * 初期設定フォームを表示する。
 *
 * @param props - フォームの入力値と操作関数。
 * @returns 大学住所、昼休みの時間、曜日を入力するフォーム。
 */
export function InitialSetupForm({
  isInitialStatePending,
  isAuthenticated,
  userName,
  selectedDays,
  handleGoogleSignIn,
  handleSignOut,
  toggleDay,
  handleSubmit,
}: InitialSetupFormController) {
  if (isInitialStatePending) {
    return (
      <main className="login-shell" aria-busy="true">
        <div className="session-loader" aria-label="ログイン状態を確認しています" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return <LoginPanel onGoogleSignIn={handleGoogleSignIn} />;
  }

  return (
    <main className="setup-shell">
      <div className="setup-decoration setup-decoration-left" aria-hidden="true" />
      <div className="setup-decoration setup-decoration-right" aria-hidden="true" />

      <section className="setup-panel" aria-labelledby="setup-title">
        <header className="setup-header">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" role="img">
              <path d="M6.5 6.5h5.8a3.7 3.7 0 0 1 3.7 3.7v15.3h-5.8a3.7 3.7 0 0 1-3.7-3.7V6.5Z" />
              <path d="M25.5 6.5h-5.8a3.7 3.7 0 0 0-3.7 3.7v15.3h5.8a3.7 3.7 0 0 0 3.7-3.7V6.5Z" />
            </svg>
          </div>
          <p className="brand-name">Koma Mesi</p>
          <p className="step-label">初期設定</p>
          <button className="sign-out-button" type="button" onClick={handleSignOut}>
            ログアウト
          </button>
        </header>

        <div className="setup-content">
          <div className="intro-copy">
            <p className="eyebrow">WELCOME</p>
            <h1 id="setup-title">あなたの大学生活を<br />教えてください</h1>
            <p className="intro-description">
              お昼休みにぴったりのお店を提案するために、<br className="desktop-break" />
              まずは普段のスケジュールを設定しましょう。
            </p>
            {userName !== null ? <p className="signed-in-user">{userName} さん</p> : null}
          </div>

          <form className="setup-form" onSubmit={handleSubmit}>
            <fieldset className="form-section">
              <legend>
                <span className="section-number">1</span>
                大学の住所
              </legend>
              <p className="section-help">普段通っているキャンパスの住所を入力してください。</p>

              <div className="address-grid">
                <label className="field postal-field">
                  <span>郵便番号</span>
                  <span className="input-with-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 21s7-5.2 7-12A7 7 0 1 0 5 9c0 6.8 7 12 7 12Z" />
                      <circle cx="12" cy="9" r="2.3" />
                    </svg>
                    <input
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

                <label className="field prefecture-field">
                  <span>都道府県</span>
                  <span className="select-wrap">
                    <select name="prefecture" defaultValue="" required>
                      <option value="" disabled>選択してください</option>
                      {PREFECTURES.map((prefecture) => (
                        <option key={prefecture} value={prefecture}>
                          {prefecture}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>

                <label className="field street-field">
                  <span>市区町村・番地</span>
                  <input
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

            <div className="form-divider" />

            <fieldset className="form-section">
              <legend>
                <span className="section-number">2</span>
                昼休みの時間
              </legend>
              <p className="section-help">授業がある日の昼休みの時間帯を選んでください。</p>
              <label className="field lunch-time-field">
                <span className="sr-only">昼休みの時間帯</span>
                <span className="input-with-icon select-wrap">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="8.5" />
                    <path d="M12 7.8v4.7l3.2 1.8" />
                  </svg>
                  <select name="lunchTime" defaultValue="" required>
                    <option value="" disabled>時間帯を選択してください</option>
                    {LUNCH_TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </span>
              </label>
            </fieldset>

            <div className="form-divider" />

            <fieldset className="form-section">
              <legend>
                <span className="section-number">3</span>
                ご飯を食べる曜日
              </legend>
              <p className="section-help">昼休みに大学周辺でご飯を食べる曜日を選んでください。</p>
              <div className="weekday-list">
                {WEEKDAYS.map((day) => (
                  <label className="weekday-option" key={day.value}>
                    <input
                      type="checkbox"
                      name="lunchDays"
                      value={day.value}
                      checked={selectedDays.includes(day.value)}
                      onChange={() => toggleDay(day.value)}
                    />
                    <span className="custom-checkbox" aria-hidden="true">
                      <svg viewBox="0 0 16 16"><path d="m3.2 8.1 3 3 6.5-6.4" /></svg>
                    </span>
                    <span>{day.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="submit-area">
              <button className="submit-button" type="submit" disabled={selectedDays.length === 0}>
                設定を完了する
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7.5 4.5 5.5 5.5-5.5 5.5" /></svg>
              </button>
              <p className="submit-note">設定はあとからマイページで変更できます</p>
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
    <main className="login-shell">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="brand-mark login-brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32">
            <path d="M6.5 6.5h5.8a3.7 3.7 0 0 1 3.7 3.7v15.3h-5.8a3.7 3.7 0 0 1-3.7-3.7V6.5Z" />
            <path d="M25.5 6.5h-5.8a3.7 3.7 0 0 0-3.7 3.7v15.3h5.8a3.7 3.7 0 0 0 3.7-3.7V6.5Z" />
          </svg>
        </div>
        <p className="login-brand-name">Koma Mesi</p>
        <p className="eyebrow">WELCOME</p>
        <h1 id="login-title">大学のランチを、<br />もっと楽しもう。</h1>
        <p className="login-description">
          あなたの授業スケジュールに合わせて、<br />昼休みにぴったりのお店を見つけます。
        </p>
        <button className="google-sign-in-button" type="button" onClick={onGoogleSignIn}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="oklch(0.62 0.2 29)" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4Z" />
            <path fill="oklch(0.7 0.16 145)" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1a5.8 5.8 0 0 1-5.4-4H3.3v2.6A10 10 0 0 0 12 22Z" />
            <path fill="oklch(0.82 0.16 86)" d="M6.6 14.1a6 6 0 0 1 0-4.2V7.3H3.3a10 10 0 0 0 0 9.4l3.3-2.6Z" />
            <path fill="oklch(0.62 0.19 253)" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 12 2a10 10 0 0 0-8.7 5.3l3.3 2.6a5.8 5.8 0 0 1 5.4-4Z" />
          </svg>
          Google でログイン
        </button>
        <p className="login-note">ログイン後、大学と昼休みの情報を設定します。</p>
      </section>
    </main>
  );
}
