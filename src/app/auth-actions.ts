"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut, auth } from "@/auth";
import { findUserByEmail, updatePassword } from "@/lib/users";

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

/** Cambia la contraseña del usuario en sesión. */
export async function changePasswordAction(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { error: "No autorizado." };

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (next !== confirm) return { error: "Las contraseñas nuevas no coinciden." };

  const r = updatePassword(email, current, next);
  return r.ok ? { ok: true } : { error: r.error };
}
