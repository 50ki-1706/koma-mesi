/**
 * oRPC procedures for public health checks and authenticated initial setup.
 * The initial setup procedures persist the user's campus and lunch schedule.
 */
import { ORPCError, os } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { WEEKDAYS, type WeekdayValue } from "@/constants/initialSetup";
import { userPreferences } from "@/db/schema";
import type { ORPCContext } from "./context";

const base = os.$context<ORPCContext>();
type AuthenticatedORPCContext = Omit<ORPCContext, "session"> & {
  session: NonNullable<ORPCContext["session"]>;
};

const protectedBase = base.use<AuthenticatedORPCContext>(
  async ({ context, next }) => {
    if (!context.session) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "Authentication required",
      });
    }

    return next({
      context: {
        ...context,
        session: context.session,
      },
    });
  },
);

const weekdayValues = WEEKDAYS.map(({ value }) => value) as [
  WeekdayValue,
  ...WeekdayValue[],
];

const initialSetupInputSchema = z.object({
  postalCode: z.string().min(1).trim(),
  prefecture: z.string().min(1).trim(),
  streetAddress: z.string().min(1).trim(),
  lunchStartTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  lunchEndTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  lunchDays: z
    .enum(weekdayValues)
    .array()
    .min(1, "At least one day is required")
    .transform((days) =>
      [...new Set(days)].sort(
        (a, b) =>
          WEEKDAYS.findIndex((w) => w.value === a) -
          WEEKDAYS.findIndex((w) => w.value === b),
      ),
    ),
});

const initialSetupRouter = base.router({
  complete: protectedBase
    .input(initialSetupInputSchema)
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const campusAddress = `〒${input.postalCode} ${input.prefecture}${input.streetAddress}`;
      const lunchDaysStr = input.lunchDays.join(",");

      await context.db
        .insert(userPreferences)
        .values({
          userId,
          campusAddress,
          campusLatitude: null,
          campusLongitude: null,
          lunchStartTime: input.lunchStartTime,
          lunchEndTime: input.lunchEndTime,
          lunchDays: lunchDaysStr,
        })
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: {
            campusAddress,
            lunchStartTime: input.lunchStartTime,
            lunchEndTime: input.lunchEndTime,
            lunchDays: lunchDaysStr,
          },
        });

      return { success: true };
    }),

  status: protectedBase.handler(async ({ context }) => {
    const userId = context.session.user.id;
    const prefs = await context.db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId),
    });
    return { isCompleted: !!prefs };
  }),
});

export const router = base.router({
  health: base.handler(() => {
    return { ok: true };
  }),
  initialSetup: initialSetupRouter,
});

export type AppRouter = typeof router;
