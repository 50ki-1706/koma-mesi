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

/** Restricts procedures to requests with an authenticated session. */
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

/** Validates a time in bounded, zero-padded 24-hour HH:MM notation. */
const boundedTimeSchema = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Invalid time format");

/** Validates and normalizes the input required to complete initial setup. */
const initialSetupInputSchema = z
  .object({
    postalCode: z.string().trim().min(1),
    prefecture: z.string().trim().min(1),
    streetAddress: z.string().trim().min(1),
    lunchStartTime: boundedTimeSchema,
    lunchEndTime: boundedTimeSchema,
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
  })
  .refine(({ lunchStartTime, lunchEndTime }) => lunchStartTime < lunchEndTime, {
    message: "Lunch start time must be before lunch end time",
    path: ["lunchEndTime"],
  });

const initialSetupRouter = base.router({
  /** Persists the authenticated user's campus address and lunch schedule. */
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
            campusLatitude: null,
            campusLongitude: null,
            lunchStartTime: input.lunchStartTime,
            lunchEndTime: input.lunchEndTime,
            lunchDays: lunchDaysStr,
            updatedAt: new Date(),
          },
        });

      return { success: true };
    }),

  /** Returns whether the authenticated user has completed initial setup. */
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
