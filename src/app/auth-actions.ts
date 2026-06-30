"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { findUserByEmail } from "@/lib/users";

/** Inicia sesión y redirige según el rol. */
export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "Correo o contraseña incorrectos." };
    }
    throw e;
  }
  const u = findUserByEmail(email);
  redirect(u?.role === "admin" ? "/admin" : "/inventario");
}

/** Cierra sesión. */
export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
