"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Shape, Stone } from "@/lib/types";
import { GemTile } from "@/components/gem-icon";
import { useSelection } from "@/components/selection-provider";
import { removeFavoriteAction } from "@/app/favorites-actions";
import { getMockStone } from "@/lib/inventory";
import { SimulateButtons } from "@/components/simulate-buttons";

/** Simulación de dos escenarios para un favorito (usa la piedra viva). */
function FavSim({ stoneId }: { stoneId: string }) {
  const live = getMockStone(stoneId);
  if (!live) return null;
  return <SimulateButtons stone={live} compact />;
}

const usdFmt = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 });
const formatUSD = (n: number) => `$${usdFmt.format(Math.round(n))} USD`;

export interface FavoriteItem {
  stoneId: string;
  snapshot: Partial<Stone>;
  available: boolean;
  priceUsd?: number;
}

export function FavoritesGrid({ items }: { items: FavoriteItem[] }) {
  const [list, setList] = useState<FavoriteItem[]>(items);
  const sel = useSelection();
  const [, startTransition] = useTransition();

  const remove = (stoneId: string) => {
    setList((prev) => prev.filter((f) => f.stoneId !== stoneId));
    startTransition(async () => {
      await removeFavoriteAction(stoneId);
    });
  };

  if (list.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--outline-variant)] bg-[var(--surface-low)] px-6 py-16 text-center">
        <p className="text-[14px] text-[var(--on-surface)]">
          Aún no tienes favoritos.
        </p>
        <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] text-[var(--on-surface-variant)]">
          Marca diamantes con ♥ en el inventario y aquí los verás con su
          disponibilidad actualizada.
        </p>
        <Link
          href="/inventario"
          className="mt-4 inline-block rounded-[8px] bg-[var(--primary)] px-4 py-2 text-[12.5px] font-medium text-[var(--on-primary)] hover:opacity-90"
        >
          Ir al inventario
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {list.map((item) => {
        const s = item.snapshot;
        const shape = (s.shape ?? "Redondo") as Shape;
        const inProposal = sel.has(item.stoneId);
        const atMax = !inProposal && sel.selected.length >= sel.max;
        return (
          <div
            key={item.stoneId}
            className={`flex flex-col gap-3 rounded-xl border bg-[var(--surface)] p-4 transition-all ${
              item.available
                ? "border-[var(--hairline)]"
                : "border-[var(--hairline)] opacity-75"
            }`}
          >
            <div className="relative">
              <Link
                href={`/inventario/${item.stoneId}`}
                className="block"
                aria-disabled={!item.available}
              >
                <GemTile shape={shape} size={88} className="aspect-square w-full" />
              </Link>
              {!item.available ? (
                <div className="absolute inset-0 grid place-items-center rounded-xl bg-[rgba(28,24,20,0.5)]">
                  <span className="label-caps rounded-[4px] bg-[var(--surface)] px-2 py-1 text-[9px] text-[var(--secondary)]">
                    Ya no disponible
                  </span>
                </div>
              ) : null}
            </div>

            <div>
              <div className="tabular text-[18px] font-semibold text-[var(--on-surface)]">
                {(s.carat ?? 0).toFixed(2)}{" "}
                <span className="text-[12px] font-normal text-[var(--on-surface-variant)]">
                  ct
                </span>
              </div>
              <div className="tabular mt-0.5 text-[11.5px] text-[var(--on-surface-variant)]">
                {shape} · {s.color} · {s.clarity} · {s.lab}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[10.5px]">
                {item.available ? (
                  <span className="flex items-center gap-1.5 text-[#5fa382]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#5fa382]" aria-hidden />
                    Disponible
                  </span>
                ) : (
                  <span className="text-[var(--secondary)]">Ya no disponible</span>
                )}
              </div>
            </div>

            <div className="mt-auto flex items-baseline justify-between border-t border-[var(--hairline)] pt-2.5">
              <span className="label-caps text-[9px] text-[var(--outline)]">
                Precio all-in
              </span>
              <span className="tabular text-[14px] font-semibold text-[var(--on-surface)]">
                {item.available && item.priceUsd !== undefined
                  ? formatUSD(item.priceUsd)
                  : "—"}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {item.available ? (
                <>
                  <button
                    type="button"
                    onClick={() => sel.add(item.stoneId)}
                    disabled={atMax}
                    className={`rounded-[8px] py-2 text-[12.5px] font-medium transition-all ${
                      inProposal
                        ? "border border-[var(--gold)] bg-[var(--warn-bg)] text-[var(--warn-text)]"
                        : atMax
                          ? "cursor-not-allowed border border-[var(--hairline)] text-[var(--outline)]"
                          : "bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90"
                    }`}
                  >
                    {inProposal
                      ? "✓ En propuesta"
                      : atMax
                        ? "Máx 4"
                        : "Agregar a propuesta"}
                  </button>
                  <FavSim stoneId={item.stoneId} />
                </>
              ) : null}
              <button
                type="button"
                onClick={() => remove(item.stoneId)}
                className="rounded-[8px] border border-[var(--hairline)] py-2 text-[12px] text-[var(--on-surface-variant)] transition-colors hover:border-[var(--secondary)] hover:text-[var(--secondary)]"
              >
                Quitar de favoritos
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
