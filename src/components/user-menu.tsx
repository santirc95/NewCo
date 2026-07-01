"use client";

import Link from "next/link";
import { logoutAction } from "@/app/auth-actions";
import type { Role } from "@/lib/types";

export interface SessionUser {
  name?: string | null;
  email?: string | null;
  role: Role;
}

/** Identidad del usuario + cerrar sesión. Clic en el nombre → portal. */
export function UserMenu({
  user,
  displayName,
  showAdminLink,
}: {
  user: SessionUser;
  /** Nombre a mostrar (negocio del joyero); cae al nombre de sesión. */
  displayName?: string | null;
  showAdminLink?: boolean;
}) {
  const isAdmin = user.role === "admin";
  const portalHref = isAdmin ? "/admin" : "/perfil";
  const name = displayName || user.name || user.email;

  return (
    <div className="flex items-center gap-2.5">
      {showAdminLink && isAdmin ? (
        <Link
          href="/admin"
          className="label-caps text-[9px] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
        >
          Admin
        </Link>
      ) : null}
      <Link
        href={portalHref}
        className="group hidden text-right leading-tight sm:block"
        title="Ir a mi portal"
      >
        <div className="text-[12px] font-medium text-[var(--on-surface)] group-hover:text-[var(--warn-text)]">
          {name}
        </div>
        <div className="label-caps text-[8.5px] text-[var(--warn-text)]">
          {isAdmin ? "Admin NewCo" : "Joyero"}
        </div>
      </Link>
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
