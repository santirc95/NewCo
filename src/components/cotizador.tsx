"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { formatMXN } from "@/lib/compute";
import {
  computeQuote,
  lineFromStone,
  DEFAULT_OP,
  DEFAULT_BANDS,
} from "@/lib/quote";
import { getMockStone, getMockStones } from "@/lib/inventory";
import { getBandsAction } from "@/app/portal-actions";
import type { MarginBand, OpParams, Stone } from "@/lib/types";
import { Button, Card, CardBody } from "@/components/ui/primitives";
import { UserMenu, type SessionUser } from "@/components/user-menu";
import { OperationCard, type RawOp } from "@/components/op-card";
import { HeroCard } from "@/components/hero-card";
import { CompositionBar } from "@/components/composition-bar";
import { BreakdownLedger } from "@/components/breakdown-ledger";
import { IvaExplainer } from "@/components/iva-explainer";

const SERVICE_LABEL = "Servicio de importación NewCo";

const DEFAULT_RAW_OP: RawOp = {
  fx: String(DEFAULT_OP.fx),
  logiMxn: String(DEFAULT_OP.logiMxn),
  igiPct: String(DEFAULT_OP.igiPct),
  dtaPct: String(DEFAULT_OP.dtaPct),
  agenteMxn: String(DEFAULT_OP.agenteMxn),
};

function toOp(raw: RawOp): OpParams {
  return {
    fx: parseFloat(raw.fx),
    logiMxn: parseFloat(raw.logiMxn),
    igiPct: parseFloat(raw.igiPct),
    dtaPct: parseFloat(raw.dtaPct),
    agenteMxn: parseFloat(raw.agenteMxn),
  };
}

export function Cotizador({
  user,
  displayName,
}: {
  user: SessionUser | null;
  displayName?: string | null;
}) {
  const [rawOp, setRawOp] = useState<RawOp>(DEFAULT_RAW_OP);
  // Por defecto una piedra (la primera del inventario); el handoff la reemplaza.
  const [stones, setStones] = useState<Stone[]>(() => [getMockStones()[0]]);
  // Bandas en vivo desde el store (las edita el admin).
  const [bands, setBands] = useState<MarginBand[]>(DEFAULT_BANDS);
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getBandsAction()
      .then((b) => b.length && setBands(b))
      .catch(() => {});
  }, []);

  const updateOp = useCallback((key: keyof OpParams, value: string) => {
    setRawOp((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Handoff desde inventario/propuestas: ?stones=ID1,ID2,...
  useEffect(() => {
    const ids = new URLSearchParams(window.location.search).get("stones");
    if (!ids) return;
    const resolved = ids
      .split(",")
      .map((id) => getMockStone(id.trim()))
      .filter((s): s is Stone => Boolean(s))
      .slice(0, 4);
    if (resolved.length) setStones(resolved);
  }, []);

  const op = useMemo(() => toOp(rawOp), [rawOp]);
  const lines = useMemo(
    () => stones.map((s) => lineFromStone(s, null, bands)),
    [stones, bands],
  );
  const quote = useMemo(() => computeQuote(lines, op), [lines, op]);

  const savings = useMemo(() => {
    if (stones.length < 2) return 0;
    const standalone = stones.reduce(
      (s, st) => s + computeQuote([lineFromStone(st, null, bands)], op).allin,
      0,
    );
    return standalone - quote.allin;
  }, [stones, op, bands, quote.allin]);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

  const multi = stones.length > 1;
  const identity = multi
    ? `Orden · ${stones.length} piedras`
    : stones[0]
      ? `${stones[0].carat.toFixed(2)} ct · ${stones[0].shape}`
      : "—";

  return (
    <div ref={scope} className="relative z-10">
      <header
        data-animate="head"
        className="no-print sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-[var(--hairline)] bg-[var(--bg)]/85 px-5 py-3 backdrop-blur-md sm:px-8"
      >
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
            <Link
              href="/inventario"
              className="label-caps text-[9px] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
            >
              Inventario
            </Link>
            <span className="label-caps text-[9px] text-[var(--on-surface)]">
              Cotizador
            </span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="solid" onClick={() => window.print()}>
            <PrintIcon />
            Export PDF
          </Button>
          {user ? <UserMenu user={user} displayName={displayName} /> : null}
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div
          data-animate="head"
          className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--hairline)] pb-5"
        >
          <div>
            <div className="label-caps text-[10px] text-[var(--on-surface-variant)]">
              Cotizador de importación
            </div>
            <span className="mt-1 block text-[18px] font-semibold text-[var(--on-surface)]">
              {identity}
            </span>
          </div>
          {!multi && stones[0] ? (
            <span className="tabular rounded-[2px] border border-[var(--hairline)] bg-[var(--surface-low)] px-2.5 py-1 text-[11.5px] text-[var(--on-surface-variant)]">
              {stones[0].certNumber}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="no-print lg:col-span-5 xl:col-span-4">
          <div className="lg:sticky lg:top-8">
            <OperationCard
              rawOp={rawOp}
              update={updateOp}
              stones={stones}
              lines={quote.lines}
            />
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-7 xl:col-span-8 print-full">
          <HeroCard
            allin={quote.allin}
            price={quote.price}
            composition={quote.composition}
            servicioLabel={SERVICE_LABEL}
          />
          <CompositionBar
            composition={quote.composition}
            price={quote.price}
            servicioLabel={SERVICE_LABEL}
          />
          <BreakdownLedger quote={quote} stones={stones} marginLabel={SERVICE_LABEL} />
          {multi ? <SavingsCard savings={savings} /> : null}
          <IvaExplainer
            allin={quote.allin}
            ivaOut={quote.ivaOut}
            price={quote.price}
          />
        </div>
        </div>

        <footer className="no-print mt-10 label-caps text-center text-[9px] text-[var(--outline)]">
          Etapa 1 · NewCo importador de registro · IVA acreditable, no es pasivo
        </footer>
      </div>
    </div>
  );
}

function SavingsCard({ savings }: { savings: number }) {
  return (
    <Card className="card-surface card-lift overflow-hidden" data-animate="card">
      <div
        aria-hidden
        className="h-[3px] w-full"
        style={{
          background:
            "linear-gradient(90deg, var(--gold), var(--gold-soft) 40%, transparent)",
        }}
      />
      <CardBody className="flex items-center justify-between gap-4 pt-5">
        <div>
          <h3 className="label-caps text-[11px] text-[var(--warn-text)]">
            Ahorro por consolidar
          </h3>
          <p className="mt-1.5 max-w-[320px] text-[12.5px] leading-relaxed text-[var(--on-surface-variant)]">
            Importar las piezas en una sola orden paga el flete y el agente
            aduanal una vez, no por cada diamante.
          </p>
        </div>
        <span className="tabular shrink-0 text-[22px] font-bold text-[var(--warn-text)]">
          {formatMXN(savings)}
        </span>
      </CardBody>
    </Card>
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
