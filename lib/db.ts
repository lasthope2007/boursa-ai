import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __boursaPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 8_000
  });
}

export const db = global.__boursaPool ?? createPool();
if (process.env.NODE_ENV !== "production") global.__boursaPool = db;
