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
import type { Stone, ProposalStatus, MarginBand } from "@/lib/types";
import type { ProposalView as TrackedProposal } from "@/lib/repo";
import { GemTile } from "@/components/gem-icon";
import { UserMenu, type SessionUser } from "@/components/user-menu";
import {
  createProposalAction,
  listProposalsAction,
  triggerHoldAction,
  payJewelerAction,
} from "@/app/actions";
import {
  listFavoriteIdsAction,
  addFavoriteAction,
  removeFavoriteAction,
} from "@/app/favorites-actions";

type Multi = Set<string>;
const MAX_SELECT = 4;

// Inventario en USD (estándar de la industria del diamante).
const usdFmt = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 });
const formatUSD = (n: number) => `$${usdFmt.format(Math.round(n))} USD`;

function toggle(set: Multi, value: string): Multi {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

/** Handoff al simulador: una o varias piedras por id. */
function simulatorHref(stoneIds: string | string[]): string {
  const ids = Array.isArray(stoneIds) ? stoneIds.join(",") : stoneIds;
  return `/?stones=${encodeURIComponent(ids)}`;
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

  const [tab, setTab] = useState<"inventario" | "propuestas">("inventario");

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

  const [selected, setSelected] = useState<Multi>(new Set());
  const [genOpen, setGenOpen] = useState(false);

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

  // Handoff desde el detalle: ?add=<id> preselecciona la piedra.
  useEffect(() => {
    const add = new URLSearchParams(window.location.search).get("add");
    if (!add || !getMockStone(add)) return;
    setSelected((prev) => {
      if (prev.has(add) || prev.size >= MAX_SELECT) return prev;
      const next = new Set(prev);
      next.add(add);
      return next;
    });
  }, []);

  // seguimiento de propuestas (polling al store del servidor)
  const [proposals, setProposals] = useState<TrackedProposal[]>([]);
  const refresh = () => listProposalsAction().then(setProposals).catch(() => {});
  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 3500);
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

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.has(id)) return toggle(prev, id);
      if (prev.size >= MAX_SELECT) return prev; // tope 1–4
      return toggle(prev, id);
    });
  };

  const pendingSignals = proposals.filter(
    (p) => p.proposal.status === "señalada",
  ).length;

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
          <nav className="ml-3 flex items-center gap-1">
            <TabBtn active={tab === "inventario"} onClick={() => setTab("inventario")}>
              Inventario
            </TabBtn>
            <TabBtn active={tab === "propuestas"} onClick={() => setTab("propuestas")}>
              Propuestas{proposals.length ? ` (${proposals.length})` : ""}
              {pendingSignals ? (
                <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
              ) : null}
            </TabBtn>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="label-caps text-[9px] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
          >
            Cotizador
          </Link>
          {user ? <UserMenu user={user} displayName={displayName} /> : null}
        </div>
      </header>

      {tab === "inventario" ? (
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
                    selected={selected.has(d.id)}
                    disabled={!selected.has(d.id) && selected.size >= MAX_SELECT}
                    onToggle={() => toggleSelect(d.id)}
                    favorite={favIds.has(d.id)}
                    onToggleFav={() => toggleFav(d.id)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      ) : (
        <ProposalsPanel proposals={proposals} onChanged={refresh} />
      )}

      {/* Bandeja: armar propuesta */}
      {tab === "inventario" && selected.size > 0 ? (
        <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-[var(--hairline)] bg-[var(--surface)]/95 px-5 py-3 backdrop-blur-md sm:px-8">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex">
                {[...selected].slice(0, 5).map((id, i) => {
                  const s = getMockStone(id);
                  return s ? (
                    <div
                      key={id}
                      className="rounded-md border border-[var(--hairline)]"
                      style={{ marginLeft: i === 0 ? 0 : -8 }}
                    >
                      <GemTile shape={s.shape} size={22} className="h-9 w-9" />
                    </div>
                  ) : null;
                })}
              </div>
              <div className="text-[13px] text-[var(--on-surface-variant)]">
                <b className="text-[var(--on-surface)]">{selected.size}</b> de {MAX_SELECT}{" "}
                {selected.size === 1 ? "piedra seleccionada" : "piedras seleccionadas"}
                <span className="ml-1.5 hidden text-[var(--outline)] sm:inline">
                  · simúlalas juntas o arma la propuesta
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={simulatorHref([...selected])}
                className="label-caps rounded-[6px] border border-[var(--gold)] px-3.5 py-2.5 text-[11px] text-[var(--warn-text)] transition-colors hover:bg-[var(--warn-bg)]"
              >
                Simular orden ({selected.size})
              </Link>
              <button
                type="button"
                onClick={() => setGenOpen(true)}
                className="label-caps inline-flex items-center gap-2 rounded-[6px] bg-[var(--primary)] px-4 py-2.5 text-[11px] text-[var(--on-primary)] transition-opacity hover:opacity-90"
              >
                Armar propuesta →
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {genOpen ? (
        <GenerateModal
          stoneIds={[...selected]}
          onClose={() => setGenOpen(false)}
          onCreated={() => {
            setSelected(new Set());
            refresh();
            setTab("propuestas");
          }}
        />
      ) : null}
    </div>
  );
}

/* --------------------------------- piezas --------------------------------- */

function TabBtn({
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
      className={`rounded-[6px] px-2.5 py-1 text-[12.5px] font-medium transition-colors ${
        active
          ? "bg-[var(--surface-low)] text-[var(--on-surface)]"
          : "text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
      }`}
    >
      {children}
    </button>
  );
}

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

function GenerateModal({
  stoneIds,
  onClose,
  onCreated,
}: {
  stoneIds: string[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [clientName, setClientName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const generate = () => {
    startTransition(async () => {
      const p = await createProposalAction(clientName, stoneIds, whatsapp);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setUrl(`${origin}/p/${p.token}`);
      onCreated();
    });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin clipboard */
    }
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,24,20,0.45)] p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card-hover)]">
        <h3 className="text-[18px] font-semibold text-[var(--on-surface)]">
          Armar propuesta
        </h3>
        <p className="mt-1 text-[12.5px] text-[var(--on-surface-variant)]">
          {stoneIds.length}{" "}
          {stoneIds.length === 1 ? "piedra seleccionada" : "piedras seleccionadas"}.
          Tu cliente verá imagen y specs (sin precio) y podrá señalar la que le
          interese.
        </p>

        {!url ? (
          <>
            <label className="mt-4 block">
              <span className="label-caps mb-1.5 block text-[9px] text-[var(--outline)]">
                Nombre del cliente
              </span>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Andrea"
                className="w-full rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2 text-[14px] text-[var(--on-surface)] outline-none placeholder:text-[var(--outline-variant)] focus:border-[var(--gold)]"
              />
            </label>
            <label className="mt-3 block">
              <span className="label-caps mb-1.5 block text-[9px] text-[var(--outline)]">
                Tu WhatsApp · para el aviso del cliente
              </span>
              <div className="flex items-center overflow-hidden rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] focus-within:border-[var(--gold)]">
                <span className="border-r border-[var(--hairline)] px-3 py-2 text-[13px] text-[var(--on-surface-variant)]">
                  🇲🇽 +52
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="55 0000 0000"
                  className="tabular w-full bg-transparent px-3 py-2 text-[14px] text-[var(--on-surface)] outline-none placeholder:text-[var(--outline-variant)]"
                />
              </div>
              <span className="mt-1 block text-[10.5px] text-[var(--outline)]">
                Cuando tu cliente marque una pieza, te llega un WhatsApp con cuál
                le gustó.
              </span>
            </label>
            <button
              type="button"
              onClick={generate}
              disabled={pending}
              className="mt-5 w-full rounded-[8px] bg-[var(--primary)] py-3 text-[13px] font-medium text-[var(--on-primary)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Generando…" : "Generar link"}
            </button>
          </>
        ) : (
          <div className="mt-4">
            <p className="label-caps text-[9px] text-[var(--outline)]">
              Link para tu cliente
            </p>
            <div className="mt-1.5 flex items-center gap-2 rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2">
              <span className="tabular flex-1 truncate text-[12px] text-[var(--on-surface)]">
                {url}
              </span>
              <button
                type="button"
                onClick={copy}
                className="label-caps shrink-0 rounded-[5px] border border-[var(--hairline)] px-2 py-1 text-[9px] text-[var(--on-surface-variant)] hover:border-[var(--gold)]"
              >
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block w-full rounded-[8px] border border-[var(--gold)] py-2.5 text-center text-[13px] font-medium text-[var(--warn-text)] transition-colors hover:bg-[var(--warn-bg)]"
            >
              Abrir como lo verá tu cliente →
            </a>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full py-1.5 text-center text-[12.5px] text-[var(--outline)] hover:text-[var(--on-surface-variant)]"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

/* ----------------------------- seguimiento -------------------------------- */

const STATUS_META: Record<ProposalStatus, { label: string; cls: string }> = {
  enviada: { label: "Enviada", cls: "border-[var(--hairline)] text-[var(--on-surface-variant)]" },
  señalada: { label: "Señalada", cls: "border-[var(--gold)] text-[var(--warn-text)] bg-[var(--warn-bg)]" },
  en_hold: { label: "Apartada", cls: "border-[#3c5a6b] text-[#5e87a0]" },
  pagada: { label: "Pagada", cls: "border-[#3f7a5e] text-[#4f9d79]" },
  ordenada: { label: "Ordenada", cls: "border-[#3f7a5e] text-[#4f9d79] bg-[rgba(79,157,121,0.08)]" },
};

function Countdown({ expiresAt }: { expiresAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const r = Math.max(0, Math.floor((expiresAt - now) / 1000));
  const h = String(Math.floor(r / 3600)).padStart(2, "0");
  const m = String(Math.floor((r % 3600) / 60)).padStart(2, "0");
  const s = String(r % 60).padStart(2, "0");
  return (
    <span className="tabular">
      {h}:{m}:{s}
    </span>
  );
}

function ProposalsPanel({
  proposals,
  onChanged,
}: {
  proposals: TrackedProposal[];
  onChanged: () => void;
}) {
  return (
    <div className="mx-auto max-w-[920px] px-5 py-6 sm:px-8">
      <h1 className="text-[20px] font-bold text-[var(--on-surface)]">Propuestas</h1>
      <p className="mt-1 text-[12.5px] text-[var(--on-surface-variant)]">
        Aquí ves la señal del cliente y avanzas: apartar (hold) → cotizar →
        cobrar a NewCo.
      </p>

      {proposals.length === 0 ? (
        <p className="py-16 text-center text-[13.5px] text-[var(--on-surface-variant)]">
          Aún no hay propuestas. Arma una desde el inventario.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {proposals.map((p) => (
            <ProposalRow key={p.proposal.id} data={p} onChanged={onChanged} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProposalRow({
  data,
  onChanged,
}: {
  data: TrackedProposal;
  onChanged: () => void;
}) {
  const { proposal, hold, order } = data;
  const meta = STATUS_META[proposal.status];
  const signaled = proposal.signaledStoneId
    ? getMockStone(proposal.signaledStoneId)
    : undefined;
  const [pending, startTransition] = useTransition();

  const doHold = () => {
    if (!proposal.signaledStoneId) return;
    startTransition(async () => {
      await triggerHoldAction(proposal.token, proposal.signaledStoneId!);
      onChanged();
    });
  };
  const doPay = () => {
    const stoneId = hold?.stoneIds?.[0] ?? proposal.signaledStoneId;
    if (!stoneId) return;
    startTransition(async () => {
      await payJewelerAction(proposal.token, stoneId);
      onChanged();
    });
  };

  return (
    <div className="rounded-xl border border-[var(--hairline)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex">
            {proposal.stoneIds.slice(0, 4).map((id, i) => {
              const s = getMockStone(id);
              return s ? (
                <div
                  key={id}
                  className={`rounded-md border ${
                    id === proposal.signaledStoneId
                      ? "border-[var(--gold)]"
                      : "border-[var(--hairline)]"
                  }`}
                  style={{ marginLeft: i === 0 ? 0 : -8 }}
                >
                  <GemTile shape={s.shape} size={22} className="h-9 w-9" />
                </div>
              ) : null;
            })}
          </div>
          <div>
            <div className="text-[14px] font-semibold text-[var(--on-surface)]">
              {proposal.clientName || "Cliente"}
            </div>
            <div className="tabular text-[11px] text-[var(--on-surface-variant)]">
              {proposal.stoneIds.length}{" "}
              {proposal.stoneIds.length === 1 ? "pieza" : "piezas"}
            </div>
          </div>
        </div>
        <span
          className={`label-caps rounded-[4px] border px-2 py-1 text-[9px] ${meta.cls}`}
        >
          {meta.label}
        </span>
      </div>

      {signaled ? (
        <div className="mt-4 rounded-lg border border-[var(--hairline)] bg-[var(--surface-low)] p-3">
          <div className="label-caps text-[9px] text-[var(--outline)]">
            El cliente señaló
          </div>
          <div className="tabular mt-1 text-[13px] text-[var(--on-surface)]">
            {signaled.carat.toFixed(2)} ct · {signaled.shape} · {signaled.color} ·{" "}
            {signaled.clarity} · {signaled.lab}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-[12.5px] text-[var(--on-surface-variant)]">
          Esperando que el cliente señale una pieza…
        </p>
      )}

      {/* Acciones según estado */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {proposal.status === "señalada" ? (
          <button
            type="button"
            onClick={doHold}
            disabled={pending}
            className="rounded-[8px] bg-[var(--primary)] px-3.5 py-2 text-[12.5px] font-medium text-[var(--on-primary)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Apartando…" : "Apartar (hold)"}
          </button>
        ) : null}

        {hold && proposal.status === "en_hold" ? (
          <>
            <span className="rounded-[8px] border border-[#3c5a6b] px-3 py-2 text-[12.5px] text-[#5e87a0]">
              Vence en <Countdown expiresAt={hold.expiresAt} />
            </span>
            {signaled ? (
              <Link
                href={simulatorHref(signaled.id)}
                className="rounded-[8px] border border-[var(--hairline)] px-3.5 py-2 text-[12.5px] text-[var(--on-surface)] transition-colors hover:border-[var(--gold)]"
              >
                Abrir en simulador →
              </Link>
            ) : null}
            <button
              type="button"
              onClick={doPay}
              disabled={pending}
              className="rounded-[8px] bg-[var(--primary)] px-3.5 py-2 text-[12.5px] font-medium text-[var(--on-primary)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Cobrando…" : "Registrar pago a NewCo"}
            </button>
          </>
        ) : null}

        {order ? (
          <span className="tabular rounded-[8px] border border-[#3f7a5e] bg-[rgba(79,157,121,0.08)] px-3 py-2 text-[12px] text-[#4f9d79]">
            Pagada · {order.jewelerPaymentRef} → orden confirmada con proveedor
          </span>
        ) : null}
      </div>
    </div>
  );
}
