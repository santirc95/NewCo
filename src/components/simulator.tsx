"use client";

import { useCallback, useMemo, useState } from "react";
import {
  computeQuote,
  DEFAULT_INPUTS,
  type QuoteInputs,
} from "@/lib/compute";
import { Button, Segmented } from "@/components/ui/primitives";
import { AssumptionsCard } from "@/components/assumptions-card";
import { HeroCard } from "@/components/hero-card";
import { CompositionBar } from "@/components/composition-bar";
import { BreakdownLedger } from "@/components/breakdown-ledger";
import { WorkingCapitalCard } from "@/components/working-capital";

/** Vista del simulador: interna (todo) o cliente (cifras de cara al joyero). */
export type View = "interna" | "cliente";

/**
 * Estado crudo de los inputs como strings. Mantener strings evita que el campo
 * pelee con el usuario al escribir decimales o vaciar el valor; los números se
 * derivan al vuelo para `computeQuote`.
 */
export type RawInputs = Record<keyof QuoteInputs, string>;

const DEFAULT_RAW: RawInputs = {
  stoneDesc: DEFAULT_INPUTS.stoneDesc,
  stoneCert: DEFAULT_INPUTS.stoneCert,
  stoneUsd: String(DEFAULT_INPUTS.stoneUsd),
  fx: String(DEFAULT_INPUTS.fx),
  logi: String(DEFAULT_INPUTS.logi),
  igi: String(DEFAULT_INPUTS.igi),
  dta: String(DEFAULT_INPUTS.dta),
  agente: String(DEFAULT_INPUTS.agente),
  margin: String(DEFAULT_INPUTS.margin),
};

function toInputs(raw: RawInputs): QuoteInputs {
  return {
    stoneDesc: raw.stoneDesc,
    stoneCert: raw.stoneCert,
    stoneUsd: parseFloat(raw.stoneUsd),
    fx: parseFloat(raw.fx),
    logi: parseFloat(raw.logi),
    igi: parseFloat(raw.igi),
    dta: parseFloat(raw.dta),
    agente: parseFloat(raw.agente),
    margin: parseFloat(raw.margin),
  };
}

export function Simulator() {
  const [raw, setRaw] = useState<RawInputs>(DEFAULT_RAW);
  const [view, setView] = useState<View>("interna");

  const update = useCallback((key: keyof RawInputs, value: string) => {
    setRaw((prev) => ({ ...prev, [key]: value }));
  }, []);

  const result = useMemo(() => computeQuote(toInputs(raw)), [raw]);

  const marginLabel =
    view === "interna" ? "Margen NewCo" : "Servicio de importación NewCo";

  return (
    <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Encabezado */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="grid h-10 w-10 place-items-center rounded-xl text-[15px] font-semibold text-[#1a1205]"
            style={{
              background:
                "linear-gradient(180deg, var(--gold), var(--gold-soft))",
              boxShadow: "0 6px 18px -8px rgba(212,175,106,0.7)",
            }}
            aria-hidden
          >
            N
          </div>
          <div>
            <h1 className="text-[17px] font-semibold leading-tight text-[var(--text)]">
              NewCo
            </h1>
            <p className="text-[12.5px] text-[var(--text-muted)]">
              Simulador de costo aterrizado · diamante B2B
            </p>
          </div>
        </div>

        <div className="no-print flex items-center gap-3">
          <Segmented<View>
            ariaLabel="Cambiar vista"
            value={view}
            onChange={setView}
            options={[
              { value: "interna", label: "Interna" },
              { value: "cliente", label: "Cliente" },
            ]}
          />
          <Button variant="solid" onClick={() => window.print()}>
            <PrintIcon />
            Export PDF
          </Button>
        </div>
      </header>

      {/* Identidad de la cotización */}
      <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-[var(--border)] pb-5">
        <span className="text-[15px] font-medium text-[var(--text)]">
          {raw.stoneDesc || "—"}
        </span>
        {raw.stoneCert ? (
          <span className="tabular rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[11.5px] text-[var(--text-muted)]">
            {raw.stoneCert}
          </span>
        ) : null}
      </div>

      {/* Cuerpo: supuestos a la izquierda, resultados a la derecha */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="no-print lg:col-span-5 xl:col-span-4">
          <div className="lg:sticky lg:top-8">
            <AssumptionsCard raw={raw} update={update} />
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-7 xl:col-span-8 print-full">
          <HeroCard allin={result.allin} price={result.price} />
          <CompositionBar result={result} servicioLabel={marginLabel} />
          <BreakdownLedger result={result} view={view} marginLabel={marginLabel} />
          {view === "interna" ? (
            <WorkingCapitalCard float={result.float} />
          ) : null}
        </div>
      </div>

      <footer className="no-print mt-10 text-center text-[11px] text-[var(--text-faint)]">
        v1 standalone · supuestos editables a mano · IVA acreditable, no es
        pasivo
      </footer>
    </div>
  );
}

function PrintIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}
