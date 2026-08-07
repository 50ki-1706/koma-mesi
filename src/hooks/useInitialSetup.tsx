/**
 * 初期設定フォームのクライアント側の状態と操作を管理する。
 * バックエンドへ依存せず、曜日選択と送信完了表示を提供する。
 */

"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  DEFAULT_LUNCH_DAYS,
  INITIAL_SETUP_DESTINATION,
  INITIAL_SETUP_STORAGE_KEY_PREFIX,
  type WeekdayValue,
} from "@/constants/initialSetup";
import { signIn, useSession } from "@/lib/auth-client";
import { logout } from "@/shared/auth/logout";

/** 初期設定画面の表示状態と操作をまとめたコントローラー。 */
export interface InitialSetupFormController {
  isInitialStatePending: boolean;
  isAuthenticated: boolean;
  userName: string | null;
  selectedDays: WeekdayValue[];
  handleGoogleSignIn: () => void;
  handleSignOut: () => void;
  toggleDay: (day: WeekdayValue) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

/**
 * 初期設定フォームに必要な状態とイベントハンドラーを返す。
 *
 * @returns 認証・初期設定状態、選択中の曜日、フォーム操作関数。
 */
export function useInitialSetup(): InitialSetupFormController {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const userId = session?.user.id ?? null;
  const [checkedUserId, setCheckedUserId] = useState<string | null | undefined>(
    undefined,
  );
  const [selectedDays, setSelectedDays] =
    useState<WeekdayValue[]>(DEFAULT_LUNCH_DAYS);

  useEffect(() => {
    if (isSessionPending) {
      return;
    }

    if (userId === null) {
      setCheckedUserId(null);
      return;
    }

    const isSetupCompleted =
      window.localStorage.getItem(createSetupStorageKey(userId)) === "true";

    if (isSetupCompleted) {
      router.replace(INITIAL_SETUP_DESTINATION);
      return;
    }

    setCheckedUserId(userId);
  }, [isSessionPending, router, userId]);

  /**
   * Google OAuthのログインフローを開始する。
   *
   * @returns なし。
   */
  const handleGoogleSignIn = (): void => {
    void signIn.social({ provider: "google" });
  };

  /**
   * 現在のGoogleログインセッションからログアウトする。
   *
   * @returns なし。
   */
  const handleSignOut = (): void => {
    void logout();
  };

  /**
   * 指定した曜日の選択状態を反転する。
   *
   * @param day - 選択状態を変更する曜日。
   * @returns なし。
   */
  const toggleDay = (day: WeekdayValue): void => {
    setSelectedDays((currentDays) =>
      currentDays.includes(day)
        ? currentDays.filter((currentDay) => currentDay !== day)
        : [...currentDays, day],
    );
  };

  /**
   * ブラウザーの入力検証後に初期設定後のページへ遷移する。
   *
   * @param event - フォーム送信イベント。
   * @returns なし。
   */
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (userId === null) {
      return;
    }

    window.localStorage.setItem(createSetupStorageKey(userId), "true");
    router.push(INITIAL_SETUP_DESTINATION);
  };

  return {
    isInitialStatePending: isSessionPending || checkedUserId !== userId,
    isAuthenticated: Boolean(session),
    userName: session?.user.name ?? null,
    selectedDays,
    handleGoogleSignIn,
    handleSignOut,
    toggleDay,
    handleSubmit,
  };
}

/**
 * Googleアカウントごとに初期設定の完了状態を保持するキーを作成する。
 *
 * @param userId - ログイン中のユーザーID。
 * @returns ユーザー固有のローカルストレージキー。
 */
function createSetupStorageKey(userId: string): string {
  return `${INITIAL_SETUP_STORAGE_KEY_PREFIX}:${userId}`;
}
