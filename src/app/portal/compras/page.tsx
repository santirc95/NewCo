import Link from "next/link";
import { auth } from "@/auth";
import { repo } from "@/lib/repo";
import { formatMXN } from "@/lib/compute";
import { STAGE_LABEL } from "@/lib/order-stages";

export const dynamic = "force-dynamic";

function fecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function ComprasPage() {
  const session = await auth();
  const jewelerId = session?.user?.jewelerId;
  const orders = jewelerId ? await repo.listOrders(jewelerId) : [];

  return (
    <div>
      <h1 className="text-[20px] font-bold text-[var(--on-surface)]">Compras</h1>
      <p className="mt-1 mb-6 text-[12.5px] text-[var(--on-surface-variant)]">
        Tus órdenes con NewCo y la trazabilidad de cada diamante.
      </p>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--outline-variant)] bg-[var(--surface-low)] px-6 py-14 text-center">
          <p className="text-[14px] text-[var(--on-surface)]">
            Aún no tienes compras.
          </p>
          <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] text-[var(--on-surface-variant)]">
            Cuando el cliente señale una pieza, la apartas y pagas a NewCo, aquí
            verás la orden con su línea de vida.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => {
            const last = o.tracking[o.tracking.length - 1];
            return (
              <Link
                key={o.id}
                href={`/portal/compras/${o.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-[var(--hairline)] bg-[var(--surface)] px-5 py-4 transition-colors hover:border-[var(--gold)]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="tabular text-[14px] font-semibold text-[var(--on-surface)]">
                      {o.folio ?? o.id}
                    </span>
                    <span className="label-caps rounded-[4px] border border-[var(--gold)]/40 bg-[var(--warn-bg)] px-1.5 py-0.5 text-[9px] text-[var(--warn-text)]">
                      {last ? STAGE_LABEL[last.stage] : "—"}
                    </span>
                  </div>
                  <div className="tabular mt-1 text-[11.5px] text-[var(--on-surface-variant)]">
                    {fecha(o.createdAt)} ·{" "}
                    {o.stoneSnapshots.length === 1
                      ? "1 diamante"
                      : `${o.stoneSnapshots.length} diamantes`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="tabular text-[14px] font-semibold text-[var(--on-surface)]">
                    {formatMXN(o.quoteSnapshot.allin)}
                  </div>
                  <div className="label-caps text-[8.5px] text-[var(--outline)]">
                    con IVA
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
