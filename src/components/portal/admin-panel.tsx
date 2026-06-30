"use client";

import { useState, useTransition } from "react";
import type { Jeweler, MarginBand } from "@/lib/types";
import {
  adminSaveBandsAction,
  adminSetJewelerActiveAction,
} from "@/app/portal-actions";

interface BandRow {
  id: string;
  min: string;
  max: string; // "" = sin tope
  pct: string;
}

function uidRow() {
  return "band-" + Math.round(performance.now() * 1000).toString(36);
}

export function AdminPanel({
  initialBands,
  initialJewelers,
}: {
  initialBands: MarginBand[];
  initialJewelers: Jeweler[];
}) {
  const [rows, setRows] = useState<BandRow[]>(() =>
    initialBands.map((b) => ({
      id: b.id,
      min: String(b.minValueUsd),
      max: b.maxValueUsd === null ? "" : String(b.maxValueUsd),
      pct: String(b.marginPct),
    })),
  );
  const [jewelers, setJewelers] = useState<Jeweler[]>(initialJewelers);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const setRow = (id: string, patch: Partial<BandRow>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const addRow = () =>
    setRows((rs) => [...rs, { id: uidRow(), min: "", max: "", pct: "" }]);
  const removeRow = (id: string) =>
    setRows((rs) => rs.filter((r) => r.id !== id));

  const saveBands = () => {
    setSaved(false);
    const bands: MarginBand[] = rows.map((r) => ({
      id: r.id,
      minValueUsd: parseFloat(r.min) || 0,
      maxValueUsd: r.max.trim() === "" ? null : parseFloat(r.max) || 0,
      marginPct: parseFloat(r.pct) || 0,
    }));
    startTransition(async () => {
      const saved = await adminSaveBandsAction(bands);
      setRows(
        saved.map((b) => ({
          id: b.id,
          min: String(b.minValueUsd),
          max: b.maxValueUsd === null ? "" : String(b.maxValueUsd),
          pct: String(b.marginPct),
        })),
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  const toggleJeweler = (j: Jeweler) => {
    startTransition(async () => {
      const updated = await adminSetJewelerActiveAction(j.id, !j.active);
      if (updated)
        setJewelers((js) => js.map((x) => (x.id === j.id ? updated : x)));
    });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Bandas de margen */}
      <section>
        <h2 className="text-[16px] font-bold text-[var(--on-surface)]">
          Bandas de margen
        </h2>
        <p className="mt-1 mb-4 text-[12.5px] text-[var(--on-surface-variant)]">
          Global por valor de piedra (USD). El servicio de cada diamante se
          resuelve según la banda en la que cae su precio de proveedor.
        </p>

        <div className="overflow-hidden rounded-xl border border-[var(--hairline)]">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 bg-[var(--surface-low)] px-3 py-2">
            {["Desde (USD)", "Hasta (USD)", "Servicio %", ""].map((h, i) => (
              <span key={i} className="label-caps text-[9px] text-[var(--outline)]">
                {h}
              </span>
            ))}
          </div>
          {rows.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2 border-t border-[var(--hairline)] px-3 py-2"
            >
              <BandInput value={r.min} onChange={(v) => setRow(r.id, { min: v })} placeholder="0" />
              <BandInput value={r.max} onChange={(v) => setRow(r.id, { max: v })} placeholder="sin tope" />
              <BandInput value={r.pct} onChange={(v) => setRow(r.id, { pct: v })} placeholder="%" />
              <button
                type="button"
                onClick={() => removeRow(r.id)}
                aria-label="Quitar banda"
                className="rounded-[6px] border border-[var(--hairline)] px-2 py-1.5 text-[12px] text-[var(--on-surface-variant)] hover:border-[var(--secondary)] hover:text-[var(--secondary)]"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={addRow}
            className="rounded-[8px] border border-[var(--hairline)] px-3.5 py-2 text-[12.5px] text-[var(--on-surface)] hover:border-[var(--gold)]"
          >
            + Agregar banda
          </button>
          <button
            type="button"
            onClick={saveBands}
            disabled={pending}
            className="rounded-[8px] bg-[var(--primary)] px-5 py-2 text-[12.5px] font-medium text-[var(--on-primary)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Guardar bandas"}
          </button>
          {saved ? (
            <span className="text-[12.5px] text-[#4f9d79]">✓ Guardado</span>
          ) : null}
        </div>
      </section>

      {/* Joyeros */}
      <section>
        <h2 className="text-[16px] font-bold text-[var(--on-surface)]">Joyeros</h2>
        <p className="mt-1 mb-4 text-[12.5px] text-[var(--on-surface-variant)]">
          Alta/baja y activación de cuentas.
        </p>
        <div className="flex flex-col gap-2">
          {jewelers.map((j) => (
            <div
              key={j.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--hairline)] bg-[var(--surface)] px-4 py-3"
            >
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-[var(--on-surface)]">
                  {j.name}
                </div>
                <div className="tabular truncate text-[11.5px] text-[var(--on-surface-variant)]">
                  {j.legalName} · {j.rfc}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`label-caps rounded-[4px] border px-2 py-1 text-[9px] ${
                    j.active
                      ? "border-[#3f7a5e] text-[#4f9d79]"
                      : "border-[var(--hairline)] text-[var(--on-surface-variant)]"
                  }`}
                >
                  {j.active ? "Activa" : "Inactiva"}
                </span>
                <button
                  type="button"
                  onClick={() => toggleJeweler(j)}
                  disabled={pending}
                  className="rounded-[6px] border border-[var(--hairline)] px-3 py-1.5 text-[12px] text-[var(--on-surface)] hover:border-[var(--gold)] disabled:opacity-50"
                >
                  {j.active ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function BandInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="tabular w-full rounded-[6px] border border-[var(--hairline)] bg-[var(--surface-low)] px-2.5 py-1.5 text-[13px] text-[var(--on-surface)] outline-none focus:border-[var(--gold)]"
    />
  );
}
