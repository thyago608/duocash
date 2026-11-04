import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

// Scripts executados pelo Node não carregam .env.local automaticamente como o Next.js.
dotenv.config({ path: ".env.local" });
dotenv.config();

import { db } from "./index";
import { users } from "./schema";

async function main() {
  const thyagoPassword = process.env.RESET_THYAGO_PASSWORD;
  const thaylaPassword = process.env.RESET_THAYLA_PASSWORD;

  if (!thyagoPassword || !thaylaPassword) {
    throw new Error(
      "Defina RESET_THYAGO_PASSWORD e RESET_THAYLA_PASSWORD no .env.local antes de continuar.",
    );
  }

  const [thyagoHash, thaylaHash] = await Promise.all([
    bcrypt.hash(thyagoPassword, 10),
    bcrypt.hash(thaylaPassword, 10),
  ]);

  const [thyago, thayla] = await Promise.all([
    db
      .update(users)
      .set({ passwordHash: thyagoHash })
      .where(eq(users.username, "thyago"))
      .returning({ username: users.username }),
    db
      .update(users)
      .set({ passwordHash: thaylaHash })
      .where(eq(users.username, "thayla"))
      .returning({ username: users.username }),
  ]);

  if (thyago.length !== 1 || thayla.length !== 1) {
    throw new Error("Não foi possível encontrar as duas contas para redefinir as senhas.");
  }

  console.log("Senhas de Thyago e Thayla redefinidas com sucesso.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
