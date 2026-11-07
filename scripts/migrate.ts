import "./env";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { migrate as migrateNeon } from "drizzle-orm/neon-serverless/migrator";
import { db } from "../src/server/db";

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  const options = { migrationsFolder: "./drizzle" };
  if (/\.neon\.tech|neon\.build/.test(url)) {
    await migrateNeon(db as unknown as Parameters<typeof migrateNeon>[0], options);
  } else {
    await migrate(db, options);
  }
  console.log("Migrations applied");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
