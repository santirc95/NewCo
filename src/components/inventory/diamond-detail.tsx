"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Stone } from "@/lib/types";
import { GemTile } from "@/components/gem-icon";
import { useSelection } from "@/components/selection-provider";
import { addFavoriteAction, removeFavoriteAction } from "@/app/favorites-actions";

const usdFmt = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 });
const formatUSD = (n: number) => `$${usdFmt.format(Math.round(n))} USD`;

const CUT_LABEL: Record<Stone["cut"], string> = {
  EX: "Excelente",
  VG: "Muy buena",
  G: "Buena",
};

function Spec({ label, value }: { label: string; value?: string | number }) {
  if (value === undefined || value === "" || value === null) return null;
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--hairline)] py-2.5">
      <span className="text-[12.5px] text-[var(--on-surface-variant)]">{label}</span>
      <span className="tabular text-[13px] font-medium text-[var(--on-surface)]">
        {value}
      </span>
    </div>
  );
}

function C4({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2.5 text-center">
      <div className="label-caps text-[9px] text-[var(--outline)]">{k}</div>
      <div className="tabular mt-1 text-[16px] font-semibold text-[var(--on-surface)]">
        {v}
      </div>
    </div>
  );
}

export function DiamondDetail({
  stone,
  priceUsd,
  initialFav,
}: {
  stone: Stone;
  priceUsd: number;
  initialFav: boolean;
}) {
  const [fav, setFav] = useState(initialFav);
  const [, startTransition] = useTransition();
  const sel = useSelection();
  const router = useRouter();
  const inProposal = sel.has(stone.id);
  const atMax = !inProposal && sel.selected.length >= sel.max;

  const addToProposal = () => {
    sel.add(stone.id);
    router.push("/inventario");
  };

  const toggleFav = () => {
    const next = !fav;
    setFav(next);
    startTransition(async () => {
      if (next) await addFavoriteAction(stone.id);
      else await removeFavoriteAction(stone.id);
    });
  };

  return (
    <div className="mx-auto max-w-[1100px] px-5 py-6 sm:px-8">
      <Link
        href="/inventario"
        className="label-caps text-[9px] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
      >
        ← Inventario
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Media — el diamante como protagonista */}
        <div>
          <div className="relative">
            {stone.videoUrl ? (
              <video
                src={stone.videoUrl}
                controls
                className="aspect-square w-full rounded-2xl bg-black object-cover"
              />
            ) : stone.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={stone.photoUrl}
                alt={`${stone.shape} ${stone.carat} ct`}
                className="aspect-square w-full rounded-2xl object-cover"
              />
            ) : (
              <GemTile shape={stone.shape} size={200} className="aspect-square w-full" />
            )}
            <button
              type="button"
              onClick={toggleFav}
              aria-pressed={fav}
              aria-label={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
              className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border border-[var(--hairline)] bg-[var(--surface)]/90 backdrop-blur transition-transform hover:scale-105"
            >
              <Heart active={fav} />
            </button>
          </div>
          {!stone.photoUrl && !stone.videoUrl ? (
            <p className="mt-2 text-center text-[10.5px] text-[var(--outline)]">
              Foto y video del proveedor se muestran aquí (demo).
            </p>
          ) : null}
        </div>

        {/* Ficha */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="tabular text-[30px] font-bold leading-none text-[var(--on-surface)]">
                {stone.carat.toFixed(2)}{" "}
                <span className="text-[16px] font-normal text-[var(--on-surface-variant)]">
                  ct
                </span>
              </h1>
              <div className="mt-1.5 text-[15px] text-[var(--on-surface)]">
                {stone.shape}
              </div>
            </div>
            <span
              className={`rounded-[4px] border px-2 py-1 text-[10px] ${
                stone.type === "natural"
                  ? "border-[var(--gold)]/50 text-[var(--warn-text)]"
                  : "border-[#3c5a6b] text-[#5e87a0]"
              }`}
            >
              {stone.type === "natural" ? "Natural" : "Lab-grown"}
            </span>
          </div>

          {/* Precio all-in */}
          <div className="mt-4 flex items-baseline justify-between rounded-xl border border-[var(--hairline)] bg-[var(--surface-low)] px-4 py-3">
            <span className="label-caps text-[9px] text-[var(--outline)]">
              Precio all-in al joyero
            </span>
            <span className="tabular text-[18px] font-semibold text-[var(--on-surface)]">
              {formatUSD(priceUsd)}
            </span>
          </div>

          {/* 4C */}
          <div className="mt-5 grid grid-cols-4 gap-2">
            <C4 k="Quilates" v={stone.carat.toFixed(2)} />
            <C4 k="Color" v={stone.color} />
            <C4 k="Claridad" v={stone.clarity} />
            <C4 k="Corte" v={CUT_LABEL[stone.cut]} />
          </div>

          {/* Specs detalladas */}
          <div className="mt-5">
            <Spec label="Pulido" value={stone.polish} />
            <Spec label="Simetría" value={stone.symmetry} />
            <Spec label="Fluorescencia" value={stone.fluorescence} />
            <Spec label="Medidas" value={stone.measurements} />
            <Spec
              label="Tabla"
              value={stone.tablePct !== undefined ? `${stone.tablePct}%` : undefined}
            />
            <Spec
              label="Profundidad"
              value={stone.depthPct !== undefined ? `${stone.depthPct}%` : undefined}
            />
            <Spec label="Origen" value={stone.origin} />
          </div>

          {/* Certificado */}
          <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--hairline)] px-4 py-3">
            <div>
              <div className="label-caps text-[9px] text-[var(--outline)]">
                Certificado
              </div>
              <div className="tabular mt-0.5 text-[13px] text-[var(--on-surface)]">
                {stone.certNumber}
              </div>
            </div>
            {stone.certUrl ? (
              <a
                href={stone.certUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="label-caps rounded-[6px] border border-[var(--hairline)] px-3 py-1.5 text-[9px] text-[var(--on-surface-variant)] hover:border-[var(--gold)]"
              >
                Ver certificado ↗
              </a>
            ) : null}
          </div>

          {/* Disponibilidad */}
          <div className="mt-3 flex items-center gap-1.5 text-[11.5px] text-[#5fa382]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5fa382]" aria-hidden />
            Disponible · hold del proveedor {stone.holdWindowHours}h
          </div>

          {/* Acciones */}
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={addToProposal}
              disabled={atMax}
              className={`flex-1 rounded-[10px] py-3 text-center text-[13px] font-medium transition-all ${
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
                  ? "Propuesta llena (máx 4)"
                  : "Agregar a propuesta"}
            </button>
            <Link
              href={`/cotizador?stones=${stone.id}`}
              className="flex-1 rounded-[10px] border border-[var(--gold)] py-3 text-center text-[13px] font-medium text-[var(--warn-text)] transition-colors hover:bg-[var(--warn-bg)]"
            >
              Simular importación
            </Link>
            <button
              type="button"
              onClick={toggleFav}
              className="rounded-[10px] border border-[var(--hairline)] px-4 py-3 text-[13px] text-[var(--on-surface)] transition-colors hover:border-[var(--gold)]"
            >
              <span className="inline-flex items-center gap-1.5">
                <Heart active={fav} small /> {fav ? "Guardado" : "Favorito"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Heart({ active, small }: { active: boolean; small?: boolean }) {
  const s = small ? 14 : 18;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill={active ? "var(--secondary)" : "none"}
      stroke={active ? "var(--secondary)" : "var(--on-surface-variant)"}
      strokeWidth="2"
      aria-hidden
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}
