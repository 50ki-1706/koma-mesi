/**
 * 初期設定フォームのクライアント側の状態と操作を管理する。
 * バックエンドへ依存せず、曜日選択と送信完了表示を提供する。
 */

"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { LOGIN_DESTINATION } from "@/constants/auth";
import {
  DEFAULT_LUNCH_DAYS,
  INITIAL_SETUP_DESTINATION,
  type WeekdayValue,
} from "@/constants/initialSetup";
import { signIn, useSession } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc/client";
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
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
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
  const [isSetupCompleted, setIsSetupCompleted] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(false);

  // Check setup status from DB after session is loaded
  useEffect(() => {
    if (isSessionPending) {
      return;
    }

    if (userId === null) {
      setCheckedUserId(null);
      setIsSetupCompleted(false);
      setIsCheckingSetup(false);
      return;
    }

    let cancelled = false;
    setIsCheckingSetup(true);

    orpc.initialSetup
      .status()
      .then(({ isCompleted }) => {
        if (!cancelled) {
          setIsSetupCompleted(isCompleted);
          setCheckedUserId(userId);
          setIsCheckingSetup(false);
        }
      })
      .catch((error) => {
        console.error("Failed to check initial setup status:", error);
        if (!cancelled) {
          setIsSetupCompleted(false);
          setCheckedUserId(userId);
          setIsCheckingSetup(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isSessionPending, userId]);

  // Redirect when setup is completed
  useEffect(() => {
    if (isSetupCompleted) {
      router.replace(INITIAL_SETUP_DESTINATION);
    }
  }, [isSetupCompleted, router]);

  /**
   * Google OAuthのログインフローを開始する。
   *
   * @returns なし。
   */
  const handleGoogleSignIn = (): void => {
    void signIn.social({
      provider: "google",
      callbackURL: LOGIN_DESTINATION,
    });
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
   * @returns 送信処理が完了したときに解決するPromise。
   */
  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (userId === null) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const postalCode = (formData.get("postalCode") as string | null) ?? "";
    const prefecture = (formData.get("prefecture") as string | null) ?? "";
    const streetAddress =
      (formData.get("streetAddress") as string | null) ?? "";
    const lunchStartTime =
      (formData.get("lunchStartTime") as string | null) ?? "";
    const lunchEndTime = (formData.get("lunchEndTime") as string | null) ?? "";

    try {
      await orpc.initialSetup.complete({
        postalCode,
        prefecture,
        streetAddress,
        lunchStartTime,
        lunchEndTime,
        lunchDays: selectedDays,
      });

      router.push(INITIAL_SETUP_DESTINATION);
    } catch (error) {
      console.error("Failed to complete initial setup:", error);
    }
  };

  return {
    isInitialStatePending:
      isSessionPending || isCheckingSetup || checkedUserId !== userId,
    isAuthenticated: Boolean(session),
    userName: session?.user.name ?? null,
    selectedDays,
    handleGoogleSignIn,
    handleSignOut,
    toggleDay,
    handleSubmit,
  };
}
