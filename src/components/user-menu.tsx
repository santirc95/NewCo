"use client";

import { useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/auth-actions";
import { PORTAL_SECTIONS } from "@/components/portal/sections";
import type { Role } from "@/lib/types";

export interface SessionUser {
  name?: string | null;
  email?: string | null;
  role: Role;
}

/**
 * Menú de usuario persistente (spec §1): clic en el nombre → secciones del
 * portal + cerrar sesión. Presente en el nav de todas las páginas.
 */
export function UserMenu({
  user,
  displayName,
}: {
  user: SessionUser;
  /** Nombre del negocio del joyero; cae al nombre de sesión. */
  displayName?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const isAdmin = user.role === "admin";
  const name = displayName || user.name || user.email;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-[8px] px-2 py-1 transition-colors hover:bg-[var(--surface-low)]"
      >
        <div className="hidden text-right leading-tight sm:block">
          <div className="text-[12px] font-medium text-[var(--on-surface)]">
            {name}
          </div>
          <div className="label-caps text-[8.5px] text-[var(--warn-text)]">
            {isAdmin ? "Admin NewCo" : "Joyero"}
          </div>
        </div>
        <div
          className="grid h-8 w-8 place-items-center rounded-full border border-[var(--gold)]/50 text-[12px] font-semibold text-[var(--warn-text)]"
          aria-hidden
        >
          {(name ?? "?").slice(0, 1).toUpperCase()}
        </div>
        <span
          aria-hidden
          className={`text-[var(--outline)] transition-transform ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-[var(--hairline)] bg-[var(--surface)] py-1 shadow-[var(--shadow-card-hover)]"
          >
            <div className="border-b border-[var(--hairline)] px-3 py-2">
              <div className="truncate text-[13px] font-semibold text-[var(--on-surface)]">
                {name}
              </div>
              <div className="truncate text-[11px] text-[var(--on-surface-variant)]">
                {user.email}
              </div>
            </div>

            {isAdmin ? (
              <MenuLink href="/admin" onClick={() => setOpen(false)}>
                Portal admin
              </MenuLink>
            ) : (
              PORTAL_SECTIONS.map((s) => (
                <MenuLink
                  key={s.href}
                  href={s.href}
                  soon={s.soon}
                  onClick={() => setOpen(false)}
                >
                  {s.label}
                </MenuLink>
              ))
            )}

            <div className="mt-1 border-t border-[var(--hairline)] pt-1">
              <form action={logoutAction}>
                <button
                  type="submit"
                  role="menuitem"
                  className="w-full px-3 py-2 text-left text-[13px] text-[var(--secondary)] transition-colors hover:bg-[var(--surface-low)]"
                >
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  children,
  onClick,
  soon,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
  soon?: boolean;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center justify-between px-3 py-2 text-[13px] text-[var(--on-surface)] transition-colors hover:bg-[var(--surface-low)]"
    >
      {children}
      {soon ? (
        <span className="label-caps text-[8px] text-[var(--outline)]">
          pronto
        </span>
      ) : null}
    </Link>
  );
}
