import type { Role } from "./types";

/**
 * Usuarios — MOCK (Etapa 1). Credenciales demo en claro, en globalThis para
 * sobrevivir HMR. Los registros por invitación se agregan aquí y su acceso al
 * inventario se gatea con `Jeweler.approved` (aprobación de admin).
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

function seedUsers(): AppUser[] {
  return [
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
    {
      id: "u-aurum",
      name: "Marco Aurum",
      email: "joyero2@demo.mx",
      password: "joyero123",
      role: "jeweler",
      jewelerId: "jwl-aurum",
    },
  ];
}

const g = globalThis as unknown as { __newcoUsersV46?: AppUser[] };
const USERS: AppUser[] = g.__newcoUsersV46 ?? (g.__newcoUsersV46 = seedUsers());

export function findUserByEmail(email: string): AppUser | undefined {
  const e = email.trim().toLowerCase();
  return USERS.find((u) => u.email.toLowerCase() === e);
}

export function verifyUser(email: string, password: string): AppUser | undefined {
  const u = findUserByEmail(email);
  return u && u.password === password ? u : undefined;
}

/** Alta por invitación (queda pendiente de aprobación vía Jeweler.approved). */
export function registerUser(input: {
  name: string;
  email: string;
  password: string;
  jewelerId: string;
}): { ok: boolean; error?: string } {
  if (findUserByEmail(input.email))
    return { ok: false, error: "Ese correo ya está registrado." };
  if (input.password.length < 6)
    return { ok: false, error: "La contraseña debe tener al menos 6 caracteres." };
  USERS.push({
    id: `u-${crypto.randomUUID().slice(0, 8)}`,
    name: input.name,
    email: input.email.trim(),
    password: input.password,
    role: "jeweler",
    jewelerId: input.jewelerId,
  });
  return { ok: true };
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
