"use client";

import { useState, useTransition } from "react";
import { formatMXN } from "@/lib/compute";
import type { Stone } from "@/lib/types";
import {
  simulateStoneAction,
  type StoneSimulation,
  type SimScenario,
} from "@/app/simulate-actions";

/**
 * Simulación por pieza — UN solo botón: el modal compara ambos escenarios
 * (Importación individual = costo real · Embarque consolidado = ESTIMADO con
 * el escalón vigente del embarque abierto). Sustituye a la antigua página
 * de cotizador; vive en tarjeta, detalle y favoritos.
 */
export function SimulateButtons({
  stone,
  compact,
}: {
  stone: Stone;
  compact?: boolean;
}) {
  const [sim, setSim] = useState<StoneSimulation | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const simulate = () => {
    if (sim) {
      setOpen(true);
      return;
    }
    startTransition(async () => {
      const r = await simulateStoneAction(stone.id);
      if (r) {
        setSim(r);
        setOpen(true);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={simulate}
        disabled={pending}
        className={`w-full rounded-[8px] border border-[var(--gold)] py-2 text-center font-medium text-[var(--warn-text)] transition-colors hover:bg-[var(--warn-bg)] disabled:opacity-50 ${
          compact ? "text-[11.5px] px-2" : "text-[12.5px] px-3"
        }`}
      >
        {pending ? "Simulando…" : "Simular importación"}
      </button>

      {open && sim ? (
        <SimModal stone={stone} sim={sim} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-[11.5px] text-[var(--on-surface-variant)]">
        {label}
      </span>
      <span className="tabular text-[12px] text-[var(--on-surface)]">
        {formatMXN(value)}
      </span>
    </div>
  );
}

function ScenarioCard({
  title,
  tag,
  s,
  highlight,
  fixedLabel,
}: {
  title: string;
  tag?: string;
  s: SimScenario;
  highlight?: boolean;
  fixedLabel: string;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-[var(--gold)] bg-[var(--warn-bg)]"
          : "border-[var(--hairline)] bg-[var(--surface-low)]"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="label-caps text-[9px] text-[var(--warn-text)]">
          {title}
        </span>
        {tag ? (
          <span className="label-caps rounded-[3px] bg-[var(--gold)] px-1.5 py-0.5 text-[7.5px] text-white">
            {tag}
          </span>
        ) : null}
      </div>
      <div className="tabular mt-2 text-[22px] font-bold leading-none text-[var(--on-surface)]">
        {formatMXN(s.priceMxn)}
      </div>
      <div className="mt-1 text-[10.5px] text-[var(--on-surface-variant)]">
        sin IVA ·{" "}
        <span className="tabular">{formatMXN(s.allinMxn)}</span> con IVA
      </div>
      <div className="mt-3 border-t border-[var(--hairline)] pt-2">
        <Row label="Piedra" value={s.stoneMxn} />
        <Row label={fixedLabel} value={s.fixedMxn} />
        <Row label="Aduana (IGI + DTA)" value={s.aduanaMxn} />
        <Row label="Servicio NewCo" value={s.serviceMxn} />
        <Row label="IVA (acreditable)" value={s.ivaMxn} />
      </div>
    </div>
  );
}

function SimModal({
  stone,
  sim,
  onClose,
}: {
  stone: Stone;
  sim: StoneSimulation;
  onClose: () => void;
}) {
  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,24,20,0.45)] p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card-hover)]">
        <h3 className="tabular text-[17px] font-semibold text-[var(--on-surface)]">
          {stone.carat.toFixed(2)} ct · {stone.shape} · {stone.color} ·{" "}
          {stone.clarity}
        </h3>
        <p className="mt-1 text-[12px] text-[var(--on-surface-variant)]">
          Dos formas de importarla — el costo sin IVA es tu costo real (el IVA
          se acredita).
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ScenarioCard
            title="Importación individual"
            s={sim.individual}
            fixedLabel="Flete + agente (completo)"
          />
          <ScenarioCard
            title="Embarque consolidado"
            tag="estimado"
            s={sim.consolidado}
            highlight
            fixedLabel={`Logística (escalón ${sim.tierLabel})`}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-[8px] bg-[rgba(95,163,130,0.12)] px-3 py-2">
          <span className="text-[12px] font-medium text-[#3f7a5e]">
            Ahorro estimado consolidando
          </span>
          <span className="tabular text-[14px] font-bold text-[#3f7a5e]">
            {formatMXN(sim.savingsMxn)}
          </span>
        </div>

        <p className="mt-2 text-[10.5px] leading-snug text-[var(--outline)]">
          Estimado con el escalón vigente del embarque abierto: {sim.aboardCount}{" "}
          {sim.aboardCount === 1 ? "piedra" : "piedras"} contando la tuya →
          escalón {sim.tierLabel} (~{formatMXN(sim.tierCostMxn)} de logística por
          pieza). Si entran más piedras, baja. El costo definitivo se congela al
          corte del embarque.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-1.5 text-center text-[12.5px] text-[var(--outline)] hover:text-[var(--on-surface-variant)]"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
