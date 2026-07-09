import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { repo } from "@/lib/repo";
import { getMockStone } from "@/lib/inventory";
import { DiamondDetail } from "@/components/inventory/diamond-detail";
import { UserMenu } from "@/components/user-menu";

export const dynamic = "force-dynamic";

export default async function StonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const stone = getMockStone(id);
  if (!stone) notFound();

  const session = await auth();
  const user = session?.user ?? null;
  const jewelerId = user?.jewelerId;
  const jeweler = jewelerId ? await repo.getJeweler(jewelerId) : null;

  const favIds = jewelerId
    ? (await repo.listFavorites(jewelerId)).map((f) => f.stoneId)
    : [];
  const held = (await repo.listHeldStoneIds()).includes(stone.id);

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
          <Link
            href="/inventario"
            className="label-caps ml-3 text-[9px] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
          >
            Inventario
          </Link>
        </div>
        {user ? <UserMenu user={user} displayName={jeweler?.name} /> : null}
      </header>

      <DiamondDetail
        stone={stone}
        held={held}
        initialFav={favIds.includes(stone.id)}
      />
    </main>
  );
}
