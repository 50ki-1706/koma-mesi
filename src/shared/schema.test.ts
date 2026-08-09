/**
 * 共有Zodスキーマの入力検証と正規化を検証する。
 * 推薦APIの日付制限・初期設定の正規化・ヘルスチェックの型制約をカバーする。
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GenerateRecommendationsInputSchema,
  healthOutputSchema,
  initialSetupInputSchema,
} from "@/shared/schema";

describe("GenerateRecommendationsInputSchema", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([undefined, "2026-08-09", "2026-08-10"])(
    "対象日の%jを許可する",
    (targetDate) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-08-08T16:00:00Z"));

      expect(
        GenerateRecommendationsInputSchema.safeParse({ targetDate }).success,
      ).toBe(true);
    },
  );

  it.each(["2026-08-08", "2026-08-11"])(
    "対象日の%sを拒否する",
    (targetDate) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-08-08T16:00:00Z"));

      expect(
        GenerateRecommendationsInputSchema.safeParse({ targetDate }).success,
      ).toBe(false);
    },
  );
});

describe("initialSetupInputSchema", () => {
  it("住所をtrimし、曜日の重複を排除して並び替える", () => {
    const result = initialSetupInputSchema.parse({
      postalCode: " 100-0001 ",
      prefecture: " 東京都 ",
      streetAddress: " 千代田1-1 ",
      lunchStartTime: "09:00",
      lunchEndTime: "12:00",
      lunchDays: ["friday", "monday", "friday"],
    });

    expect(result.postalCode).toBe("100-0001");
    expect(result.prefecture).toBe("東京都");
    expect(result.streetAddress).toBe("千代田1-1");
    expect(result.lunchDays).toEqual(["monday", "friday"]);
  });

  it("開始時刻と終了時刻が等しい入力を拒否する", () => {
    expect(
      initialSetupInputSchema.safeParse({
        postalCode: "100-0001",
        prefecture: "東京都",
        streetAddress: "千代田1-1",
        lunchStartTime: "12:00",
        lunchEndTime: "12:00",
        lunchDays: ["monday"],
      }).success,
    ).toBe(false);
  });
});

describe("healthOutputSchema", () => {
  it("ok: falseを拒否する", () => {
    expect(healthOutputSchema.safeParse({ ok: false }).success).toBe(false);
  });
});
