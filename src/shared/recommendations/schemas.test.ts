/**
 * 推薦APIのZod入力Schemaが日付範囲を拒否できることを検証する。
 * 外部API課金につながる生成対象日を当日と翌日に限定する。
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { GenerateRecommendationsInputSchema } from "./schemas";

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
