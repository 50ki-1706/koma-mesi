// Configures Better Auth for local, Vercel Preview, and production environments.
// Proxies Google OAuth callbacks through the stable production deployment.

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { oAuthProxy } from "better-auth/plugins";
import { db } from "@/db";
import * as authSchema from "@/db/schema";
import { resolveAuthCredentials } from "./auth-env";

const {
  allowedHosts,
  productionUrl,
  googleClientId,
  googleClientSecret,
  oauthProxySecret,
} = resolveAuthCredentials();

/** Provides the Better Auth server configuration for application route handlers. */
export const auth = betterAuth({
  baseURL: {
    allowedHosts,
    protocol: "auto",
  },
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: authSchema.user,
      session: authSchema.session,
      account: authSchema.account,
      verification: authSchema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
  },
  plugins: [
    oAuthProxy({
      productionURL: productionUrl,
      secret: oauthProxySecret,
    }),
  ],
});
