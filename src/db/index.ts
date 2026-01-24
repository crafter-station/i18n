import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "./schema";

let _db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb() {
  if (!_db) {
    const sql = neon(process.env.DATABASE_URL!);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

// For backwards compatibility
export const db = {
  get query() {
    return getDb().query;
  },
  insert: (...args: Parameters<NeonHttpDatabase<typeof schema>["insert"]>) =>
    getDb().insert(...args),
  update: (...args: Parameters<NeonHttpDatabase<typeof schema>["update"]>) =>
    getDb().update(...args),
  delete: (...args: Parameters<NeonHttpDatabase<typeof schema>["delete"]>) =>
    getDb().delete(...args),
  select: (...args: Parameters<NeonHttpDatabase<typeof schema>["select"]>) =>
    getDb().select(...args),
};
