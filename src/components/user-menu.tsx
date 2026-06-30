"use client";

import Link from "next/link";
import { logoutAction } from "@/app/auth-actions";
import type { Role } from "@/lib/types";

export interface SessionUser {
  name?: string | null;
  email?: string | null;
  role: Role;
}

/** Identidad del usuario + cerrar sesión. Muestra el rol activo. */
export function UserMenu({
  user,
  showAdminLink,
}: {
  user: SessionUser;
  showAdminLink?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {showAdminLink && user.role === "admin" ? (
        <Link
          href="/admin"
          className="label-caps text-[9px] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
        >
          Admin
        </Link>
      ) : null}
      <div className="hidden text-right leading-tight sm:block">
        <div className="text-[12px] font-medium text-[var(--on-surface)]">
          {user.name ?? user.email}
        </div>
        <div className="label-caps text-[8.5px] text-[var(--warn-text)]">
          {user.role === "admin" ? "Admin NewCo" : "Joyero"}
        </div>
      </div>
      <form action={logoutAction}>
        <button
          type="submit"
          className="rounded-[6px] border border-[var(--hairline)] px-2.5 py-1.5 text-[11.5px] text-[var(--on-surface-variant)] transition-colors hover:border-[var(--gold)] hover:text-[var(--on-surface)]"
        >
          Salir
        </button>
      </form>
    </div>
  );
}
