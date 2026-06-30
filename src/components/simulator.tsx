"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  computeQuote,
  DEFAULT_INPUTS,
  type QuoteInputs,
} from "@/lib/compute";
import { Button } from "@/components/ui/primitives";
import { AssumptionsCard } from "@/components/assumptions-card";
import { HeroCard } from "@/components/hero-card";
import { CompositionBar } from "@/components/composition-bar";
import { BreakdownLedger } from "@/components/breakdown-ledger";
import { IvaExplainer } from "@/components/iva-explainer";

/** Etiqueta única del servicio de NewCo (vista única del joyero). */
const SERVICE_LABEL = "Servicio de importación NewCo";

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
  const scope = useRef<HTMLDivElement>(null);

  const update = useCallback((key: keyof RawInputs, value: string) => {
    setRaw((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Handoff desde el inventario: ?stoneUsd=&cert=&desc= siembra la piedra.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const patch: Partial<RawInputs> = {};
    const usd = sp.get("stoneUsd");
    const cert = sp.get("cert");
    const desc = sp.get("desc");
    if (usd) patch.stoneUsd = usd;
    if (cert) patch.stoneCert = cert;
    if (desc) patch.stoneDesc = desc;
    if (Object.keys(patch).length) setRaw((prev) => ({ ...prev, ...patch }));
  }, []);

  const result = useMemo(() => computeQuote(toInputs(raw)), [raw]);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduce || document.hidden) return;

      const heads = root.querySelectorAll('[data-animate="head"]');
      const cards = root.querySelectorAll('[data-animate="card"]');

      if (heads.length) {
        gsap.from(heads, { opacity: 0, y: 8, duration: 0.5, ease: "power2.out" });
      }
      if (cards.length) {
        gsap.from(cards, {
          opacity: 0,
          y: 14,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.08,
          delay: 0.1,
          clearProps: "transform",
        });
      }
    },
    { scope, dependencies: [] },
  );

  return (
    <div
      ref={scope}
      className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10"
    >
      {/* Encabezado */}
      <header
        data-animate="head"
        className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <div
            className="grid h-10 w-10 place-items-center rounded-[5px] bg-[var(--primary)] text-[15px] font-bold text-[var(--on-primary)] ring-1 ring-inset ring-[var(--gold)]/30 shadow-[0_4px_14px_-6px_rgba(26,21,16,0.6)]"
            aria-hidden
          >
            N
          </div>
          <div>
            <h1 className="text-[17px] font-bold leading-tight text-[var(--on-surface)]">
              NewCo
            </h1>
            <p className="label-caps text-[10px] text-[var(--on-surface-variant)]">
              Simulador de adquisición · lo que pagas a NewCo
            </p>
          </div>
        </div>

        <div className="no-print flex items-center gap-4">
          <Link
            href="/inventario"
            className="label-caps text-[9px] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
          >
            ← Inventario
          </Link>
          <Button variant="solid" onClick={() => window.print()}>
            <PrintIcon />
            Export PDF
          </Button>
        </div>
      </header>

      {/* Identidad de la cotización */}
      <div
        data-animate="head"
        className="mb-6 flex flex-wrap items-center gap-3 border-b border-[var(--hairline)] pb-5"
      >
        <span className="text-[15px] font-semibold text-[var(--on-surface)]">
          {raw.stoneDesc || "—"}
        </span>
        {raw.stoneCert ? (
          <span className="tabular rounded-[2px] border border-[var(--hairline)] bg-[var(--surface-low)] px-2.5 py-1 text-[11.5px] text-[var(--on-surface-variant)]">
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
          <HeroCard result={result} servicioLabel={SERVICE_LABEL} />
          <CompositionBar result={result} servicioLabel={SERVICE_LABEL} />
          <BreakdownLedger result={result} marginLabel={SERVICE_LABEL} />
          <IvaExplainer
            allin={result.allin}
            ivaOut={result.ivaOut}
            price={result.price}
          />
        </div>
      </div>

      <footer className="no-print mt-10 label-caps text-center text-[9px] text-[var(--outline)]">
        Etapa 1 · NewCo importador de registro · IVA acreditable, no es pasivo
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
