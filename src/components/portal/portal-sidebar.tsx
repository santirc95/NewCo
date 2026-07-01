"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PORTAL_SECTIONS } from "@/components/portal/sections";

/** Navegación lateral del portal del joyero. */
export function PortalSidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-row flex-wrap gap-1.5 lg:flex-col lg:gap-0.5">
      {PORTAL_SECTIONS.map((s) => {
        const active = pathname === s.href;
        return (
          <Link
            key={s.href}
            href={s.href}
            className={`flex items-center justify-between rounded-[8px] px-3 py-2 text-[13px] transition-colors ${
              active
                ? "bg-[var(--surface-low)] font-medium text-[var(--on-surface)]"
                : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-low)] hover:text-[var(--on-surface)]"
            }`}
          >
            {s.label}
            {s.soon ? (
              <span className="label-caps text-[8px] text-[var(--outline)]">
                pronto
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
