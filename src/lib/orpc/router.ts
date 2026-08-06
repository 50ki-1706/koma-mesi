import { os } from "@orpc/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { counters, posts } from "@/db/schema";
import type { ORPCContext } from "./context";

const base = os.$context<ORPCContext>();

function getUserId(context: ORPCContext) {
  const userId = context.session?.user.id;

  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }

  return userId;
}

const protectedProcedure = base.use(async ({ context, next }) => {
  if (!context.session) {
    throw new Error("UNAUTHORIZED");
  }

  return next();
});

export const router = {
  health: base.handler(() => {
    return { ok: true };
  }),

  post: {
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
        }),
      )
      .handler(async ({ input, context }) => {
        const [post] = await context.db
          .insert(posts)
          .values({
            title: input.title,
            createdAt: new Date(),
          })
          .returning();

        return post;
      }),
  },

  counter: {
    // 返却保証: 常に counter オブジェクトを返す。null/undefined 非許容。
    // 未存在時は count=0 で自動作成
    get: protectedProcedure.handler(async ({ context }) => {
      const userId = getUserId(context);

      const [inserted] = await context.db
        .insert(counters)
        .values({ userId, count: 0 })
        .onConflictDoNothing()
        .returning();
      if (inserted) return inserted;

      const [existing] = await context.db
        .select()
        .from(counters)
        .where(eq(counters.userId, userId));
      if (!existing) throw new Error("Counter not found — data inconsistency");
      return existing;
    }),

    // 単一SQL文でアトミックに +1
    increment: protectedProcedure.handler(async ({ context }) => {
      const userId = getUserId(context);

      const [counter] = await context.db
        .insert(counters)
        .values({ userId, count: 1 })
        .onConflictDoUpdate({
          target: counters.userId,
          set: { count: sql`${counters.count} + 1` },
        })
        .returning();
      return counter;
    }),

    // 単一SQL文でアトミックに -1
    decrement: protectedProcedure.handler(async ({ context }) => {
      const userId = getUserId(context);

      const [counter] = await context.db
        .insert(counters)
        .values({ userId, count: -1 })
        .onConflictDoUpdate({
          target: counters.userId,
          set: { count: sql`${counters.count} - 1` },
        })
        .returning();
      return counter;
    }),
  },
};

export type AppRouter = typeof router;
