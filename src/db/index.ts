// Creates the libSQL client and Drizzle ORM instance used by the application.
// Uses environment-based credentials so the same code works locally and on Vercel.

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { resolveDatabaseCredentials } from "./env";
import * as schema from "./schema";

const { url, authToken } = resolveDatabaseCredentials();

const client = createClient({
  url,
  ...(authToken !== undefined && { authToken }),
});

export const db = drizzle(client, { schema });
