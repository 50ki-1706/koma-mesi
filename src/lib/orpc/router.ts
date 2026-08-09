/**
 * アプリケーションが公開するoRPC procedureを1つのルーターへ集約する。
 * health・推薦・初期設定の各procedureをクライアントへ公開する。
 */
import { ORPCError, os } from "@orpc/server";
import { eq } from "drizzle-orm";
import { userPreferences } from "@/db/schema";
import type { GeocodedLocation } from "@/shared/campus/geocoding";
import { GooglePlacesError } from "@/shared/recommendations/googlePlaces";
import {
  healthOutputSchema,
  initialSetupInputSchema,
  initialSetupStatusOutputSchema,
} from "@/shared/schema";
import type { ORPCContext } from "./context";
import { recommendationRouter } from "./recommendation";

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

const initialSetupRouter = base.router({
  /** Persists the authenticated user's campus address and lunch schedule. */
  complete: protectedBase
    .input(initialSetupInputSchema)
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const campusAddress = `〒${input.postalCode} ${input.prefecture}${input.streetAddress}`;
      const lunchDaysStr = input.lunchDays.join(",");
      let location: GeocodedLocation | null;
      try {
        location = await context.geocodeAddress(campusAddress);
      } catch (error) {
        if (error instanceof GooglePlacesError) {
          throw error;
        }
        location = null;
      }

      await context.db
        .insert(userPreferences)
        .values({
          userId,
          campusAddress,
          campusLatitude: location?.latitude ?? null,
          campusLongitude: location?.longitude ?? null,
          lunchStartTime: input.lunchStartTime,
          lunchEndTime: input.lunchEndTime,
          lunchDays: lunchDaysStr,
        })
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: {
            campusAddress,
            campusLatitude: location?.latitude ?? null,
            campusLongitude: location?.longitude ?? null,
            lunchStartTime: input.lunchStartTime,
            lunchEndTime: input.lunchEndTime,
            lunchDays: lunchDaysStr,
            updatedAt: new Date(),
          },
        });

      return { success: true };
    }),

  /** Returns whether the authenticated user has completed initial setup, and their campus location if known. */
  status: protectedBase
    .output(initialSetupStatusOutputSchema)
    .handler(async ({ context }) => {
      const userId = context.session.user.id;
      const prefs = await context.db.query.userPreferences.findFirst({
        where: eq(userPreferences.userId, userId),
      });
      const campusLocation =
        prefs?.campusLatitude != null && prefs.campusLongitude != null
          ? { latitude: prefs.campusLatitude, longitude: prefs.campusLongitude }
          : null;
      return { isCompleted: !!prefs, campusLocation };
    }),
});

/** アプリケーションが公開するoRPCルーター。 */
export const router = base.router({
  health: base
    .route({
      method: "GET",
      path: "/health",
      operationId: "health",
      summary: "APIの稼働状態を取得する",
      tags: ["system"],
    })
    .output(healthOutputSchema)
    .handler(() => {
      return { ok: true as const };
    }),
  recommendation: recommendationRouter,
  initialSetup: initialSetupRouter,
});

/** クライアントへ共有するoRPCルーター型。 */
export type AppRouter = typeof router;
