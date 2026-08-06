"use client";

import { InitialSetupForm } from "@/app/InitialSetupForm";
import { useInitialSetup } from "@/hooks/useInitialSetup";

/**
 * 大学と昼休みの情報を登録する初期設定ページを表示する。
 *
 * @returns 初期設定フォームを含むページ。
 */
export default function Home() {
    const setup = useInitialSetup();
    return <InitialSetupForm {...setup} />;
}