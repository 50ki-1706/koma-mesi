import { headers } from "next/headers";
import { db } from "@/db";
import { auth } from "@/lib/auth";

export async function createORPCContext() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return {
    db,
    session,
  };
}

export type ORPCContext = Awaited<ReturnType<typeof createORPCContext>>;
