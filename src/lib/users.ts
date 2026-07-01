import type { Role } from "./types";

/**
 * Usuarios — MOCK (Etapa 1). Credenciales demo en claro.
 * // TODO Cap.2: usuarios reales con hash de contraseña + base de datos.
 */
export interface AppUser {
  id: string;
  name: string;
  email: string;
  password: string; // demo en claro
  role: Role;
  jewelerId?: string; // sólo para role 'jeweler'
}

const USERS: AppUser[] = [
  {
    id: "u-admin",
    name: "NewCo Admin",
    email: "admin@newco.mx",
    password: "newco123",
    role: "admin",
  },
  {
    id: "u-vecchia",
    name: "Lucía Vecchia",
    email: "joyero@demo.mx",
    password: "joyero123",
    role: "jeweler",
    jewelerId: "jwl-vecchia",
  },
];

export function findUserByEmail(email: string): AppUser | undefined {
  const e = email.trim().toLowerCase();
  return USERS.find((u) => u.email.toLowerCase() === e);
}

export function verifyUser(email: string, password: string): AppUser | undefined {
  const u = findUserByEmail(email);
  return u && u.password === password ? u : undefined;
}

/**
 * Cambia la contraseña de un usuario (mock, en memoria del proceso).
 * // TODO Cap.2: hash + persistencia real.
 */
export function updatePassword(
  email: string,
  current: string,
  next: string,
): { ok: boolean; error?: string } {
  const u = findUserByEmail(email);
  if (!u) return { ok: false, error: "Usuario no encontrado." };
  if (u.password !== current)
    return { ok: false, error: "La contraseña actual no coincide." };
  if (next.length < 6)
    return { ok: false, error: "La nueva contraseña debe tener al menos 6 caracteres." };
  u.password = next;
  return { ok: true };
}
