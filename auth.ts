import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Usuário" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username;
        const password = credentials?.password;

        if (typeof username !== "string" || typeof password !== "string") {
          return null;
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username.toLowerCase().trim()))
          .limit(1);

        if (!user) {
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);

        if (!valid) {
          return null;
        }

        return { id: user.id, name: user.name };
      },
    }),
  ],
});
