import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

// O Drizzle é executado fora do runtime do Next.js e precisa carregar .env.local explicitamente.
dotenv.config({ path: ".env.local" });
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
