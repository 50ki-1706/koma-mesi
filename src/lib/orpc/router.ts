import { os } from "@orpc/server";
import type { ORPCContext } from "./context";

const base = os.$context<ORPCContext>();

export const router = {
  health: base.handler(() => {
    return { ok: true };
  }),
};

export type AppRouter = typeof router;
