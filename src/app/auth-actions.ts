"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut, auth } from "@/auth";
import { repo } from "@/lib/repo";
import { findUserByEmail, updatePassword, registerUser } from "@/lib/users";

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

/**
 * Registro por invitación (público). Crea el usuario + su perfil de joyero
 * con `approved: false` — el acceso al inventario se libera cuando el admin
 * aprueba la cuenta.
 */
export async function registerAction(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!name || !email || !password)
    return { error: "Completa nombre, correo y contraseña." };
  if (findUserByEmail(email))
    return { error: "Ese correo ya está registrado." };

  const jeweler = await repo.createJeweler({
    role: "jeweler",
    name,
    rfc: "",
    razonSocial: "",
    regimenFiscal: "",
    cpFiscal: "",
    usoCfdi: "",
    domicilioFiscal: {
      calle: "",
      numExt: "",
      colonia: "",
      municipio: "",
      estado: "",
      cp: "",
    },
    active: true,
    approved: false, // ← requiere aprobación del admin
  });
  const r = registerUser({ name, email, password, jewelerId: jeweler.id });
  if (!r.ok) return { error: r.error };
  return { ok: true };
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
