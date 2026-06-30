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
