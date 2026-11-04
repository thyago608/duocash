"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = { error: string | null };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = formData.get("username");
  const password = formData.get("password");

  try {
    await signIn("credentials", {
      username,
      password,
      redirectTo: "/dashboard",
    });
    return { error: null };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Usuário ou senha incorretos." };
    }
    throw error;
  }
}
