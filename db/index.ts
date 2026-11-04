import dotenv from "dotenv";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Scripts Node (seed/reset) não passam pelo carregamento automático de env do Next.js.
dotenv.config({ path: ".env.local" });
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const isNeon = process.env.DATABASE_URL.includes("neon.tech");

// Em produção usamos o driver HTTP serverless do Neon; localmente, contra um
// Postgres comum (ex. Docker), usamos o driver node-postgres via protocolo TCP.
export const db = isNeon
  ? drizzleNeon(neon(process.env.DATABASE_URL), { schema })
  : drizzleNodePostgres(new Pool({ connectionString: process.env.DATABASE_URL }), { schema });
