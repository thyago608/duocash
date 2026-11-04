import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

import { migrate as migrateNeon } from "drizzle-orm/neon-http/migrator";
import { migrate as migrateNodePostgres } from "drizzle-orm/node-postgres/migrator";
import { db } from "./index";

async function main() {
  const config = { migrationsFolder: "./drizzle" };

  if (process.env.DATABASE_URL?.includes("neon.tech")) {
    await migrateNeon(db as never, config);
  } else {
    await migrateNodePostgres(db as never, config);
  }

  console.log("Migrações aplicadas com sucesso.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
