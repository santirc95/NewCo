import Link from "next/link";
import { UserMenu, type SessionUser } from "@/components/user-menu";

type Active = "inventario" | "simulador" | "perfil" | "admin" | "portal";

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`label-caps text-[9px] transition-colors ${
        active
          ? "text-[var(--on-surface)]"
          : "text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
      }`}
    >
      {children}
    </Link>
  );
}

/** Header común de los portales (joyero / admin) con identidad y cerrar sesión. */
export function PortalHeader({
  user,
  active,
  displayName,
}: {
  user: SessionUser;
  active: Active;
  displayName?: string | null;
}) {
  const isAdmin = user.role === "admin";
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[var(--hairline)] bg-[var(--bg)]/85 px-5 py-3 backdrop-blur-md sm:px-8">
      <div className="flex items-center gap-3">
        <div
          className="grid h-8 w-8 place-items-center rounded-[4px] bg-[var(--primary)] text-[13px] font-bold text-[var(--on-primary)] ring-1 ring-inset ring-[var(--gold)]/30"
          aria-hidden
        >
          N
        </div>
        <span className="text-[15px] font-bold text-[var(--on-surface)]">NewCo</span>
        <nav className="ml-3 flex items-center gap-3">
          {isAdmin ? (
            <NavLink href="/admin" active={active === "admin"}>
              Admin
            </NavLink>
          ) : (
            <>
              <NavLink href="/inventario" active={active === "inventario"}>
                Inventario
              </NavLink>
              <NavLink href="/cotizador" active={active === "simulador"}>
                Cotizador
              </NavLink>
              <NavLink href="/propuestas" active={false}>
                Propuestas
              </NavLink>
              <NavLink href="/embarques" active={false}>
                Embarques
              </NavLink>
            </>
          )}
        </nav>
      </div>
      <UserMenu user={user} displayName={displayName} />
    </header>
  );
}
