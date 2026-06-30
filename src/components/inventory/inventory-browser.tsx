"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PRICING_ASSUMPTIONS, stoneAllIn } from "@/lib/pricing";
import {
  getMockStones,
  SHAPES,
  COLORS,
  CLARITIES,
  CUTS,
  LABS,
} from "@/lib/inventory";
import { JEWELERS } from "@/lib/jewelers";
import { encodeProposal } from "@/lib/proposal-token";
import type { JewelerBranding, Stone } from "@/lib/types";
import { GemTile } from "@/components/gem-icon";

type Multi = Set<string>;

// El inventario del joyero se cotiza en USD (estándar de la industria). El
// precio all-in (MXN) se expresa en USD al tipo de cambio de los supuestos.
const usdFmt = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 });
const formatUSD = (n: number) => `$${usdFmt.format(Math.round(n))} USD`;
const toUsd = (mxn: number) => mxn / PRICING_ASSUMPTIONS.fx;

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

function toggle(set: Multi, value: string): Multi {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export function InventoryBrowser() {
  const stones = useMemo(() => getMockStones(), []);
  // Precio all-in expresado en USD (estándar de la industria del diamante).
  const allInUsd = useMemo(() => {
    const m = new Map<string, number>();
    stones.forEach((s) => m.set(s.id, toUsd(stoneAllIn(s))));
    return m;
  }, [stones]);

  // marca activa del joyero
  const [jewelerId, setJewelerId] = useState(JEWELERS[0].id);
  const [branding, setBranding] = useState<JewelerBranding>(
    JEWELERS[0].branding,
  );
  const [brandOpen, setBrandOpen] = useState(false);

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

  // selección + generación
  const [selected, setSelected] = useState<Multi>(new Set());
  const [genOpen, setGenOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);

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

  const selectJeweler = (id: string) => {
    const j = JEWELERS.find((x) => x.id === id);
    if (!j) return;
    setJewelerId(id);
    setBranding(j.branding);
  };

  const openGenerate = () => {
    setGeneratedUrl("");
    setCopied(false);
    setGenOpen(true);
  };

  const generate = () => {
    const token = encodeProposal({
      jeweler: branding,
      clientName: clientName.trim(),
      stoneIds: [...selected],
    });
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    setGeneratedUrl(`${origin}/p/${token}`);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard no disponible */
    }
  };

  const selectedStones = stones.filter((s) => selected.has(s.id));

  return (
    <div className="relative z-10 pb-28">
      {/* Barra superior */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[var(--hairline)] bg-[var(--bg)]/85 px-5 py-3 backdrop-blur-md sm:px-8">
        <div className="flex items-center gap-3">
          <div
            className="grid h-8 w-8 place-items-center rounded-[4px] bg-[var(--primary)] text-[13px] font-bold text-[var(--on-primary)] ring-1 ring-inset ring-[var(--gold)]/30"
            aria-hidden
          >
            N
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-bold text-[var(--on-surface)]">
              NewCo
            </span>
            <span className="label-caps text-[9px] text-[var(--on-surface-variant)]">
              Inventario
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className="label-caps hidden text-[9px] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] sm:inline"
          >
            Simulador
          </Link>
          <button
            type="button"
            onClick={() => setBrandOpen(true)}
            className="flex items-center gap-2 rounded-[6px] border border-[var(--hairline)] bg-[var(--surface)] px-2.5 py-1.5 text-[12.5px] text-[var(--on-surface-variant)] transition-colors hover:border-[var(--gold)]"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full border border-[var(--gold)]/50 text-[10px] font-semibold text-[var(--warn-text)]">
              {branding.logoText || "·"}
            </span>
            <span className="max-w-[160px] truncate text-[var(--on-surface)]">
              {branding.name}
            </span>
            <span aria-hidden className="text-[var(--outline)]">
              ▾
            </span>
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1280px] grid-cols-1 lg:grid-cols-[248px_1fr]">
        {/* Filtros */}
        <aside className="no-print hidden border-r border-[var(--hairline)] px-5 py-6 lg:block">
          <FilterSection title="Forma">
            <div className="flex flex-wrap gap-1.5">
              {SHAPES.map((s) => (
                <Chip key={s} active={shape.has(s)} onClick={() => setShape(toggle(shape, s))}>
                  {s}
                </Chip>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Tipo">
            <div className="flex flex-wrap gap-1.5">
              {(["natural", "lab"] as const).map((t) => (
                <Chip
                  key={t}
                  active={type === t}
                  onClick={() => setType(type === t ? "" : t)}
                >
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
            <div className="flex flex-wrap gap-1.5">
              {COLORS.map((c) => (
                <Chip key={c} active={color.has(c)} onClick={() => setColor(toggle(color, c))}>
                  {c}
                </Chip>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Claridad">
            <div className="flex flex-wrap gap-1.5">
              {CLARITIES.map((c) => (
                <Chip key={c} active={clarity.has(c)} onClick={() => setClarity(toggle(clarity, c))}>
                  {c}
                </Chip>
              ))}
            </div>
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
            <div className="flex flex-wrap gap-1.5">
              {LABS.map((l) => (
                <Chip key={l} active={lab.has(l)} onClick={() => setLab(toggle(lab, l))}>
                  {l}
                </Chip>
              ))}
            </div>
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

        {/* Resultados */}
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
                Conectado a API de proveedor · precio all-in calculado en vivo
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
                  onToggle={() => setSelected(toggle(selected, d.id))}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Bandeja de propuesta */}
      {selected.size > 0 ? (
        <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-[var(--hairline)] bg-[var(--surface)]/95 px-5 py-3 backdrop-blur-md sm:px-8">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex">
                {selectedStones.slice(0, 5).map((s, i) => (
                  <div
                    key={s.id}
                    className="rounded-md border border-[var(--hairline)]"
                    style={{ marginLeft: i === 0 ? 0 : -8 }}
                  >
                    <GemTile shape={s.shape} size={22} className="h-9 w-9" />
                  </div>
                ))}
              </div>
              <div className="text-[13px] text-[var(--on-surface-variant)]">
                <b className="text-[var(--on-surface)]">{selected.size}</b>{" "}
                {selected.size === 1 ? "piedra" : "piedras"} en la propuesta
              </div>
            </div>
            <button
              type="button"
              onClick={openGenerate}
              className="label-caps inline-flex items-center gap-2 rounded-[6px] bg-[var(--primary)] px-4 py-2.5 text-[11px] text-[var(--on-primary)] transition-opacity hover:opacity-90"
            >
              Generar link con la marca de {branding.name} →
            </button>
          </div>
        </div>
      ) : null}

      {/* Editor de marca */}
      {brandOpen ? (
        <BrandingEditor
          branding={branding}
          jewelerId={jewelerId}
          onSelectJeweler={selectJeweler}
          onChange={setBranding}
          onClose={() => setBrandOpen(false)}
        />
      ) : null}

      {/* Modal generar link */}
      {genOpen ? (
        <GenerateModal
          count={selected.size}
          jewelerName={branding.name}
          clientName={clientName}
          onClientName={setClientName}
          generatedUrl={generatedUrl}
          copied={copied}
          onGenerate={generate}
          onCopy={copy}
          onClose={() => setGenOpen(false)}
        />
      ) : null}
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

function StoneCard({
  stone,
  priceUsd,
  selected,
  onToggle,
}: {
  stone: Stone;
  priceUsd: number;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border bg-[var(--surface)] p-4 transition-all duration-150 ${
        selected
          ? "border-[var(--gold)] shadow-[0_0_0_1px_var(--gold)]"
          : "border-[var(--hairline)] hover:border-[var(--hairline-strong)]"
      }`}
    >
      <GemTile shape={stone.shape} size={56} className="h-24" />
      <div>
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
      </div>
      <div className="mt-auto flex items-baseline justify-between border-t border-[var(--hairline)] pt-2.5">
        <span className="label-caps text-[9px] text-[var(--outline)]">
          Precio all-in
        </span>
        <span className="tabular text-[14px] font-semibold text-[var(--on-surface)]">
          {formatUSD(priceUsd)}
        </span>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`rounded-[8px] py-2 text-[12.5px] font-medium transition-all ${
          selected
            ? "bg-[var(--primary)] text-[var(--on-primary)]"
            : "border border-[var(--hairline)] bg-[var(--surface-low)] text-[var(--on-surface)] hover:border-[var(--gold)]"
        }`}
      >
        {selected ? "✓ En propuesta" : "Agregar a propuesta"}
      </button>
    </div>
  );
}

function Overlay({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,24,20,0.45)] p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}

function BrandingEditor({
  branding,
  jewelerId,
  onSelectJeweler,
  onChange,
  onClose,
}: {
  branding: JewelerBranding;
  jewelerId: string;
  onSelectJeweler: (id: string) => void;
  onChange: (b: JewelerBranding) => void;
  onClose: () => void;
}) {
  const set = (patch: Partial<JewelerBranding>) =>
    onChange({ ...branding, ...patch });
  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card-hover)]">
        <h3 className="label-caps text-[11px] text-[var(--warn-text)]">
          Tu marca
        </h3>
        <p className="mt-1 text-[12.5px] text-[var(--on-surface-variant)]">
          Así verá tu cliente la propuesta. NewCo no aparece.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <Field label="Joyero (preset)">
            <select
              value={jewelerId}
              onChange={(e) => onSelectJeweler(e.target.value)}
              className="w-full rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2 text-[14px] text-[var(--on-surface)] outline-none focus:border-[var(--gold)]"
            >
              {JEWELERS.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-[80px_1fr] gap-3">
            <Field label="Sello">
              <BrandInput
                value={branding.logoText}
                onChange={(v) => set({ logoText: v.slice(0, 2) })}
                placeholder="V"
              />
            </Field>
            <Field label="Nombre">
              <BrandInput
                value={branding.name}
                onChange={(v) => set({ name: v })}
                placeholder="Vecchia Jewelry"
              />
            </Field>
          </div>
          <Field label="Tagline">
            <BrandInput
              value={branding.tagline}
              onChange={(v) => set({ tagline: v })}
              placeholder="Alta joyería · desde 1987"
            />
          </Field>
          <Field label="Dirección / contacto">
            <BrandInput
              value={branding.address}
              onChange={(v) => set({ address: v })}
              placeholder="Av. Masaryk · Polanco, CDMX"
            />
          </Field>
          <Field label="Asesor(a)">
            <BrandInput
              value={branding.advisorName}
              onChange={(v) => set({ advisorName: v })}
              placeholder="Lucía Vecchia"
            />
          </Field>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-[8px] bg-[var(--primary)] py-2.5 text-[13px] font-medium text-[var(--on-primary)] transition-opacity hover:opacity-90"
        >
          Listo
        </button>
      </div>
    </Overlay>
  );
}

function GenerateModal({
  count,
  jewelerName,
  clientName,
  onClientName,
  generatedUrl,
  copied,
  onGenerate,
  onCopy,
  onClose,
}: {
  count: number;
  jewelerName: string;
  clientName: string;
  onClientName: (v: string) => void;
  generatedUrl: string;
  copied: boolean;
  onGenerate: () => void;
  onCopy: () => void;
  onClose: () => void;
}) {
  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card-hover)]">
        <h3 className="text-[18px] font-semibold text-[var(--on-surface)]">
          Generar link para tu cliente
        </h3>
        <p className="mt-1 text-[12.5px] text-[var(--on-surface-variant)]">
          {count} {count === 1 ? "piedra seleccionada" : "piedras seleccionadas"}{" "}
          · con la marca de {jewelerName}. Tu cliente podrá apartar 1 mientras
          decide.
        </p>

        {!generatedUrl ? (
          <>
            <div className="mt-4">
              <Field label="Para tu cliente (nombre)">
                <BrandInput
                  value={clientName}
                  onChange={onClientName}
                  placeholder="Andrea"
                />
              </Field>
            </div>
            <button
              type="button"
              onClick={onGenerate}
              className="mt-5 w-full rounded-[8px] bg-[var(--primary)] py-3 text-[13px] font-medium text-[var(--on-primary)] transition-opacity hover:opacity-90"
            >
              Generar link
            </button>
          </>
        ) : (
          <div className="mt-4">
            <p className="label-caps text-[9px] text-[var(--outline)]">
              Link de propuesta
            </p>
            <div className="mt-1.5 flex items-center gap-2 rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2">
              <span className="tabular flex-1 truncate text-[12px] text-[var(--on-surface)]">
                {generatedUrl}
              </span>
              <button
                type="button"
                onClick={onCopy}
                className="label-caps shrink-0 rounded-[5px] border border-[var(--hairline)] px-2 py-1 text-[9px] text-[var(--on-surface-variant)] hover:border-[var(--gold)]"
              >
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
            <a
              href={generatedUrl}
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
    </Overlay>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label-caps mb-1.5 block text-[9px] text-[var(--outline)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function BrandInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-[8px] border border-[var(--hairline)] bg-[var(--surface-low)] px-3 py-2 text-[14px] text-[var(--on-surface)] outline-none placeholder:text-[var(--outline-variant)] focus:border-[var(--gold)]"
    />
  );
}
