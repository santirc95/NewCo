import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { repo } from "@/lib/repo";
import { getMockStone } from "@/lib/inventory";
import { quoteStones, DEFAULT_OP } from "@/lib/quote";
import { UserMenu } from "@/components/user-menu";
import { FavoritesGrid, type FavoriteItem } from "@/components/favorites-grid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "NewCo · Favoritos",
};

export default async function FavoritosPage() {
  const session = await auth();
  const user = session?.user ?? null;
  const jewelerId = user?.jewelerId;
  const jeweler = jewelerId ? await repo.getJeweler(jewelerId) : null;

  const favs = jewelerId ? await repo.listFavorites(jewelerId) : [];
  const bands = await repo.listBands();

  // Revalidación contra el inventario vivo (el snapshot pudo quedar viejo).
  const items: FavoriteItem[] = favs.map((f) => {
    const live = getMockStone(f.stoneId);
    return {
      stoneId: f.stoneId,
      snapshot: f.snapshot,
      available: Boolean(live),
      priceUsd: live
        ? quoteStones([live], DEFAULT_OP, null, bands).allin / DEFAULT_OP.fx
        : undefined,
    };
  });

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
              href="/propuestas"
              className="label-caps text-[9px] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
            >
              Propuestas
            </Link>
            <span className="label-caps text-[9px] text-[var(--on-surface)]">
              Favoritos
            </span>
          </nav>
        </div>
        {user ? <UserMenu user={user} displayName={jeweler?.name} /> : null}
      </header>

      <div className="mx-auto w-full max-w-[1280px] px-5 py-8 sm:px-8">
        <h1 className="text-[20px] font-bold text-[var(--on-surface)]">
          Favoritos
        </h1>
        <p className="mt-1 mb-6 text-[12.5px] text-[var(--on-surface-variant)]">
          Tus diamantes marcados. La disponibilidad y el precio se revalidan
          contra el inventario del proveedor.
        </p>
        <FavoritesGrid items={items} />
      </div>
    </main>
  );
}
