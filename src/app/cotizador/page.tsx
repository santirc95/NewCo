import { auth } from "@/auth";
import { repo } from "@/lib/repo";
import { Cotizador } from "@/components/cotizador";

export const dynamic = "force-dynamic";

export default async function CotizadorPage() {
  const session = await auth();
  const user = session?.user ?? null;
  const jeweler = user?.jewelerId ? await repo.getJeweler(user.jewelerId) : null;
  return (
    <main className="flex-1">
      <Cotizador user={user} displayName={jeweler?.name} />
    </main>
  );
}
