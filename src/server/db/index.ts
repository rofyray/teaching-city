import { Pool as NeonPool } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

function isNeon(url: string) {
  return /\.neon\.tech|neon\.build/.test(url);
}

function createDb(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (isNeon(url)) {
    // The Neon driver speaks the same query API; the cast keeps one Db type for both drivers.
    return drizzleNeon({ client: new NeonPool({ connectionString: url }), schema }) as unknown as Db;
  }
  return drizzlePg({ client: new PgPool({ connectionString: url, max: 5 }), schema });
}

const globalForDb = globalThis as unknown as { __tcDb?: Db };

export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    globalForDb.__tcDb ??= createDb();
    return Reflect.get(globalForDb.__tcDb, prop);
  },
});

export { schema };
