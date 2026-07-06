"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { quoteStones, DEFAULT_OP, DEFAULT_BANDS } from "@/lib/quote";
import { getBandsAction } from "@/app/portal-actions";
import {
  getMockStones,
  getMockStone,
  SHAPES,
  COLORS,
  CLARITIES,
  CUTS,
  LABS,
} from "@/lib/inventory";
import type { Stone, MarginBand } from "@/lib/types";
import { GemTile } from "@/components/gem-icon";
import { UserMenu, type SessionUser } from "@/components/user-menu";
import { useSelection, MAX_SELECT } from "@/components/selection-provider";
import { listProposalsAction } from "@/app/actions";
import {
  listFavoriteIdsAction,
  addFavoriteAction,
  removeFavoriteAction,
} from "@/app/favorites-actions";

type Multi = Set<string>;

// Inventario en USD (estándar de la industria del diamante).
const usdFmt = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 });
const formatUSD = (n: number) => `$${usdFmt.format(Math.round(n))} USD`;

function toggle(set: Multi, value: string): Multi {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

/** Handoff al cotizador: una o varias piedras por id. */
function simulatorHref(stoneIds: string | string[]): string {
  const ids = Array.isArray(stoneIds) ? stoneIds.join(",") : stoneIds;
  return `/cotizador?stones=${encodeURIComponent(ids)}`;
}

export function InventoryBrowser({
  user,
  displayName,
}: {
  user: SessionUser | null;
  displayName?: string | null;
}) {
  const stones = useMemo(() => getMockStones(), []);
  const [bands, setBands] = useState<MarginBand[]>(DEFAULT_BANDS);
  useEffect(() => {
    getBandsAction()
      .then((b) => b.length && setBands(b))
      .catch(() => {});
  }, []);

  const allInUsd = useMemo(() => {
    const m = new Map<string, number>();
    stones.forEach((s) =>
      m.set(s.id, quoteStones([s], DEFAULT_OP, null, bands).allin / DEFAULT_OP.fx),
    );
    return m;
  }, [stones, bands]);

  // filtros
  const [shape, setShape] = useState<Multi>(new Set());
  const [type, setType] = useState<"" | "natural" | "lab">("");
  const [color, setColor] = useState<Multi>(new Set());
  const [clarity, setClarity] = useState<Multi>(new Set());
  const [cut, setCut] = useState<Multi>(new Set());
  const [lab, setLab] = useState<Multi>(new Set());
  const [ctMin, setCtMin] = useState("");
  const [ctMax, setCtMax] = useState("");
  const [priceMax, setPriceMax] = useState("");

  // Selección de propuesta: contexto en el layout raíz (persiste entre páginas).
  const sel = useSelection();

  // Favoritos (♥) con snapshot en el servidor.
  const [favIds, setFavIds] = useState<Multi>(new Set());
  const [, startFav] = useTransition();
  useEffect(() => {
    listFavoriteIdsAction()
      .then((ids) => setFavIds(new Set(ids)))
      .catch(() => {});
  }, []);
  const toggleFav = (id: string) => {
    const has = favIds.has(id);
    setFavIds((prev) => {
      const next = new Set(prev);
      if (has) next.delete(id);
      else next.add(id);
      return next;
    });
    startFav(async () => {
      if (has) await removeFavoriteAction(id);
      else await addFavoriteAction(id);
    });
  };


  // aviso de señales pendientes (la gestión vive en /propuestas)
  const [pendingSignals, setPendingSignals] = useState(0);
  useEffect(() => {
    const load = () =>
      listProposalsAction()
        .then((ps) =>
          setPendingSignals(
            ps.filter((p) => p.proposal.status === "señalada").length,
          ),
        )
        .catch(() => {});
    load();
    const i = setInterval(load, 5000);
    return () => clearInterval(i);
  }, []);

  const filtered = useMemo(() => {
    const min = parseFloat(ctMin) || 0;
    const max = parseFloat(ctMax) || 99;
    const pMax = parseFloat(priceMax) || Infinity;
    const clarityMatch = (c: string) => {
      if (clarity.size === 0) return true;
      if (c === "FL" || c === "IF") return clarity.has("FL/IF");
      return clarity.has(c);
    };
    return stones.filter(
      (d) =>
        (shape.size === 0 || shape.has(d.shape)) &&
        (type === "" || d.type === type) &&
        d.carat >= min &&
        d.carat <= max &&
        (color.size === 0 || color.has(d.color)) &&
        clarityMatch(d.clarity) &&
        (cut.size === 0 || cut.has(d.cut)) &&
        (lab.size === 0 || lab.has(d.lab)) &&
        (allInUsd.get(d.id) ?? 0) <= pMax,
    );
  }, [stones, allInUsd, shape, type, color, clarity, cut, lab, ctMin, ctMax, priceMax]);

  const clearAll = () => {
    setShape(new Set());
    setType("");
    setColor(new Set());
    setClarity(new Set());
    setCut(new Set());
    setLab(new Set());
    setCtMin("");
    setCtMax("");
    setPriceMax("");
  };

  return (
    <div className="relative z-10 pb-28">
      <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[var(--hairline)] bg-[var(--bg)]/85 px-5 py-3 backdrop-blur-md sm:px-8">
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
            <span className="label-caps text-[9px] text-[var(--on-surface)]">
              Inventario
            </span>
            <Link
              href="/cotizador"
              className="label-caps text-[9px] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
            >
              Cotizador
            </Link>
            <Link
              href="/propuestas"
              className="label-caps flex items-center gap-1 text-[9px] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
            >
              Propuestas
              {pendingSignals ? (
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--gold)]"
                  title={`${pendingSignals} con señal del cliente`}
                />
              ) : null}
            </Link>
            <Link
              href="/embarques"
              className="label-caps text-[9px] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
            >
              Embarques
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {user ? <UserMenu user={user} displayName={displayName} /> : null}
        </div>
      </header>

      <div className="mx-auto grid max-w-[1280px] grid-cols-1 lg:grid-cols-[248px_1fr]">
          <aside className="no-print hidden border-r border-[var(--hairline)] px-5 py-6 lg:block">
            <FilterSection title="Forma">
              <ChipRow items={SHAPES} set={shape} onToggle={(v) => setShape(toggle(shape, v))} />
            </FilterSection>
            <FilterSection title="Tipo">
              <div className="flex flex-wrap gap-1.5">
                {(["natural", "lab"] as const).map((t) => (
                  <Chip key={t} active={type === t} onClick={() => setType(type === t ? "" : t)}>
                    {t === "natural" ? "Natural" : "Lab-grown"}
                  </Chip>
                ))}
              </div>
            </FilterSection>
            <FilterSection title="Quilataje (ct)">
              <div className="flex items-center gap-2">
                <RangeInput value={ctMin} onChange={setCtMin} placeholder="mín" />
                <span className="text-[var(--outline)]">—</span>
                <RangeInput value={ctMax} onChange={setCtMax} placeholder="máx" />
              </div>
            </FilterSection>
            <FilterSection title="Color">
              <ChipRow items={COLORS} set={color} onToggle={(v) => setColor(toggle(color, v))} />
            </FilterSection>
            <FilterSection title="Claridad">
              <ChipRow items={CLARITIES} set={clarity} onToggle={(v) => setClarity(toggle(clarity, v))} />
            </FilterSection>
            <FilterSection title="Corte">
              <div className="flex flex-wrap gap-1.5">
                {CUTS.map((c) => (
                  <Chip key={c.value} active={cut.has(c.value)} onClick={() => setCut(toggle(cut, c.value))}>
                    {c.label}
                  </Chip>
                ))}
              </div>
            </FilterSection>
            <FilterSection title="Certificadora">
              <ChipRow items={LABS} set={lab} onToggle={(v) => setLab(toggle(lab, v))} />
            </FilterSection>
            <FilterSection title="Precio máx (USD)">
              <RangeInput value={priceMax} onChange={setPriceMax} placeholder="sin límite" wide />
            </FilterSection>
            <button
              type="button"
              onClick={clearAll}
              className="mt-1 w-full rounded-[6px] border border-[var(--hairline)] py-2 text-[11.5px] text-[var(--on-surface-variant)] transition-colors hover:border-[var(--gold)] hover:text-[var(--on-surface)]"
            >
              Limpiar filtros
            </button>
          </aside>

          <main className="px-5 py-6 sm:px-8">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h1 className="text-[20px] font-bold text-[var(--on-surface)]">
                  Inventario disponible
                </h1>
                <div className="mt-1 flex items-center gap-2 text-[11.5px] text-[var(--on-surface-variant)]">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-[#5fa382]"
                    style={{ boxShadow: "0 0 8px #5fa382" }}
                    aria-hidden
                  />
                  Conectado a API de proveedor · precio all-in (USD) en vivo
                </div>
              </div>
              <div className="tabular text-[12.5px] text-[var(--on-surface-variant)]">
                {filtered.length} de {stones.length} piedras
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className="py-16 text-center text-[13.5px] text-[var(--on-surface-variant)]">
                Ningún diamante coincide con esos filtros. Ajusta los criterios.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((d) => (
                  <StoneCard
                    key={d.id}
                    stone={d}
                    priceUsd={allInUsd.get(d.id) ?? 0}
                    selected={sel.has(d.id)}
                    disabled={!sel.has(d.id) && sel.selected.length >= MAX_SELECT}
                    onToggle={() => sel.toggle(d.id)}
                    favorite={favIds.has(d.id)}
                    onToggleFav={() => toggleFav(d.id)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
    </div>
  );
}

/* --------------------------------- piezas --------------------------------- */

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[6px] border px-2.5 py-1 text-[11.5px] transition-colors duration-150 ${
        active
          ? "border-[var(--gold)] bg-[var(--warn-bg)] text-[var(--warn-text)]"
          : "border-[var(--hairline)] bg-[var(--surface-low)] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
      }`}
    >
      {children}
    </button>
  );
}

function ChipRow({
  items,
  set,
  onToggle,
}: {
  items: readonly string[];
  set: Multi;
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <Chip key={it} active={set.has(it)} onClick={() => onToggle(it)}>
          {it}
        </Chip>
      ))}
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <p className="label-caps mb-2 text-[10px] text-[var(--outline)]">{title}</p>
      {children}
    </div>
  );
}

function RangeInput({
  value,
  onChange,
  placeholder,
  wide,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  wide?: boolean;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`tabular ${wide ? "w-full" : "w-full min-w-0"} rounded-[6px] border border-[var(--hairline)] bg-[var(--surface)] px-2.5 py-1.5 text-center text-[12.5px] text-[var(--on-surface)] outline-none focus:border-[var(--gold)]`}
    />
  );
}

function MiniHeart({ active }: { active: boolean }) {
  return (
    <svg
      width="15"
      height="15"
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

function StoneCard({
  stone,
  priceUsd,
  selected,
  disabled,
  onToggle,
  favorite,
  onToggleFav,
}: {
  stone: Stone;
  priceUsd: number;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
  favorite: boolean;
  onToggleFav: () => void;
}) {
  const detailHref = `/inventario/${stone.id}`;
  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border bg-[var(--surface)] p-4 transition-all duration-150 ${
        selected
          ? "border-[var(--gold)] shadow-[0_0_0_1px_var(--gold)]"
          : "border-[var(--hairline)] hover:border-[var(--hairline-strong)]"
      }`}
    >
      <div className="relative">
        <Link href={detailHref} className="block">
          <GemTile
            shape={stone.shape}
            size={88}
            photoUrl={stone.photoUrl}
            className="aspect-square w-full"
          />
        </Link>
        <button
          type="button"
          onClick={onToggleFav}
          aria-pressed={favorite}
          aria-label={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border border-[var(--hairline)] bg-[var(--surface)]/90 backdrop-blur transition-transform hover:scale-105"
        >
          <MiniHeart active={favorite} />
        </button>
      </div>
      <Link href={detailHref} className="block">
        <div className="tabular text-[18px] font-semibold text-[var(--on-surface)]">
          {stone.carat.toFixed(2)}{" "}
          <span className="text-[12px] font-normal text-[var(--on-surface-variant)]">
            ct
          </span>
        </div>
        <div className="tabular mt-0.5 text-[11.5px] text-[var(--on-surface-variant)]">
          {stone.shape} · {stone.color} · {stone.clarity} · {stone.cut}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-[4px] border border-[var(--hairline)] px-1.5 py-0.5 text-[10px] text-[var(--on-surface-variant)]">
            {stone.lab}
          </span>
          <span
            className={`rounded-[4px] border px-1.5 py-0.5 text-[10px] ${
              stone.type === "natural"
                ? "border-[var(--gold)]/50 text-[var(--warn-text)]"
                : "border-[#3c5a6b] text-[#5e87a0]"
            }`}
          >
            {stone.type === "natural" ? "Natural" : "Lab-grown"}
          </span>
          <span className="text-[10.5px] text-[#5fa382]">
            ● hold {stone.holdWindowHours}h
          </span>
        </div>
      </Link>
      <div className="mt-auto flex items-baseline justify-between border-t border-[var(--hairline)] pt-2.5">
        <span className="label-caps text-[9px] text-[var(--outline)]">
          Precio all-in
        </span>
        <span className="tabular text-[14px] font-semibold text-[var(--on-surface)]">
          {formatUSD(priceUsd)}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className={`rounded-[8px] py-2 text-[12.5px] font-medium transition-all ${
            selected
              ? "bg-[var(--primary)] text-[var(--on-primary)]"
              : disabled
                ? "cursor-not-allowed border border-[var(--hairline)] text-[var(--outline)]"
                : "border border-[var(--hairline)] bg-[var(--surface-low)] text-[var(--on-surface)] hover:border-[var(--gold)]"
          }`}
        >
          {selected ? "✓ En propuesta" : disabled ? "Máx 4" : "Agregar a propuesta"}
        </button>
        <Link
          href={simulatorHref(stone.id)}
          className="rounded-[8px] border border-[var(--gold)] py-2 text-center text-[12.5px] font-medium text-[var(--warn-text)] transition-colors hover:bg-[var(--warn-bg)]"
        >
          Simular importación
        </Link>
      </div>
    </div>
  );
}


