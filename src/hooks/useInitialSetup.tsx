/**
 * 初期設定フォームのクライアント側の状態と操作を管理する。
 * バックエンドへ依存せず、曜日選択と送信完了表示を提供する。
 */

"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { LOGIN_DESTINATION } from "@/constants/auth";
import {
  DEFAULT_LUNCH_DAYS,
  INITIAL_SETUP_DESTINATION,
  LUNCH_TIME_RANGE_ERROR_MESSAGE,
  type WeekdayValue,
} from "@/constants/initialSetup";
import { signIn, useSession } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc/client";
import { logout } from "@/shared/auth/logout";

/** 初期設定画面の表示状態と操作をまとめたコントローラー。 */
export interface InitialSetupFormController {
  isInitialStatePending: boolean;
  isInitialSetupStatusError: boolean;
  isAuthenticated: boolean;
  userName: string | null;
  selectedDays: WeekdayValue[];
  lunchTimeError: string | null;
  errorMessage: string | null;
  isSubmitting: boolean;
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
  const [isSetupCompleted, setIsSetupCompleted] = useState<boolean | null>(
    null,
  );
  const [isCheckingSetup, setIsCheckingSetup] = useState(false);
  const [isInitialSetupStatusError, setIsInitialSetupStatusError] =
    useState(false);
  const [lunchTimeError, setLunchTimeError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  // Check setup status from DB after session is loaded
  useEffect(() => {
    if (isSessionPending) {
      return;
    }

    if (userId === null) {
      setCheckedUserId(null);
      setIsSetupCompleted(false);
      setIsInitialSetupStatusError(false);
      setIsCheckingSetup(false);
      setErrorMessage(null);
      return;
    }

    let cancelled = false;
    setIsSetupCompleted(null);
    setIsInitialSetupStatusError(false);
    setErrorMessage(null);
    setIsCheckingSetup(true);

    orpc.initialSetup
      .status()
      .then(({ isCompleted }) => {
        if (!cancelled) {
          setIsSetupCompleted(isCompleted);
          setIsInitialSetupStatusError(false);
          setCheckedUserId(userId);
          setIsCheckingSetup(false);
          setErrorMessage(null);
        }
      })
      .catch((error) => {
        console.error("Failed to check initial setup status:", error);
        if (!cancelled) {
          setIsSetupCompleted(null);
          setIsInitialSetupStatusError(true);
          setCheckedUserId(userId);
          setIsCheckingSetup(false);
          setErrorMessage(
            "初期設定の状態を確認できませんでした。ブラウザーを再読み込みしてください。",
          );
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
   */
  const handleGoogleSignIn = (): void => {
    void signIn.social({
      provider: "google",
      callbackURL: LOGIN_DESTINATION,
    });
  };

  /**
   * Googleアカウントのログアウト処理を実行する。
   */
  const handleSignOut = (): void => {
    void logout();
  };

  /**
   * 指定された曜日の選択状態を切り替える。
   *
   * @param day - 切り替える曜日の値。
   */
  const toggleDay = (day: WeekdayValue): void => {
    setSelectedDays((currentDays) =>
      currentDays.includes(day)
        ? currentDays.filter((currentDay) => currentDay !== day)
        : [...currentDays, day],
    );
  };

  /**
   * ブラウザーの入力検証後、昼休みの時間帯を確認してから初期設定後のページへ遷移する。
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
    const lunchStartTime = getStringField(formData, "lunchStartTime");
    const lunchEndTime = getStringField(formData, "lunchEndTime");

    if (lunchEndTime <= lunchStartTime) {
      setLunchTimeError(LUNCH_TIME_RANGE_ERROR_MESSAGE);
      return;
    }

    setLunchTimeError(null);

    if (
      isInitialSetupStatusError ||
      isSetupCompleted === null ||
      isSubmittingRef.current
    ) {
      return;
    }

    setErrorMessage(null);
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const postalCode = getStringField(formData, "postalCode");
      const prefecture = getStringField(formData, "prefecture");
      const streetAddress = getStringField(formData, "streetAddress");

      await orpc.initialSetup.complete({
        postalCode,
        prefecture,
        streetAddress,
        lunchStartTime,
        lunchEndTime,
        lunchDays: selectedDays,
      });

      setErrorMessage(null);
      router.push(INITIAL_SETUP_DESTINATION);
    } catch (error) {
      console.error("Failed to complete initial setup:", error);
      setErrorMessage(
        "初期設定を保存できませんでした。もう一度お試しください。",
      );
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return {
    isInitialStatePending:
      isSessionPending || isCheckingSetup || checkedUserId !== userId,
    isInitialSetupStatusError,
    isAuthenticated: Boolean(session),
    userName: session?.user.name ?? null,
    selectedDays,
    lunchTimeError,
    errorMessage,
    isSubmitting,
    handleGoogleSignIn,
    handleSignOut,
    toggleDay,
    handleSubmit,
  };
}

/**
 * FormDataから文字列の入力値を取得する。
 *
 * @param formData - 入力フォームのFormData。
 * @param key - 取得するフィールド名。
 * @returns 文字列の入力値、または文字列でない場合は空文字列。
 */
function getStringField(formData: FormData, key: string): string {
  const value: unknown = formData.get(key);

  return typeof value === "string" ? value : "";
}
