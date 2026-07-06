import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { repo } from "@/lib/repo";
import { UserMenu } from "@/components/user-menu";
import { ProposalsManager } from "@/components/proposals/proposals-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "NewCo · Propuestas",
};

export default async function PropuestasPage() {
  const session = await auth();
  const user = session?.user ?? null;
  const jeweler = user?.jewelerId ? await repo.getJeweler(user.jewelerId) : null;

  return (
    <main className="flex-1">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[var(--hairline)] bg-[var(--bg)]/85 px-5 py-3 backdrop-blur-md sm:px-8">
        <div className="flex items-center gap-3">
          <div
            className="grid h-8 w-8 place-items-center rounded-[4px] bg-[var(--primary)] text-[13px] font-bold text-[var(--on-primary)] ring-1 ring-inset ring-[var(--gold)]/30"
            aria-hidden
          >
            N
          </div>
          <span className="text-[15px] font-bold text-[var(--on-surface)]">
            NewCo
          </span>
          <nav className="ml-3 flex items-center gap-3">
            <Link
              href="/inventario"
              className="label-caps text-[9px] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
            >
              Inventario
            </Link>
            <Link
              href="/cotizador"
              className="label-caps text-[9px] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
            >
              Cotizador
            </Link>
            <span className="label-caps text-[9px] text-[var(--on-surface)]">
              Propuestas
            </span>
          </nav>
        </div>
        {user ? <UserMenu user={user} displayName={jeweler?.name} /> : null}
      </header>

      <ProposalsManager />
    </main>
  );
}
