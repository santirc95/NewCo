"use client";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { formatMXN } from "@/lib/compute";
import type { Quote, Stone } from "@/lib/types";

interface BreakdownLedgerProps {
  quote: Quote;
  stones: Stone[];
  /** Etiqueta de la línea de servicio NewCo. */
  marginLabel: string;
}

type RowVariant = "item" | "sub" | "subtotal" | "total";

function LedgerRow({
  label,
  value,
  variant = "item",
  tag,
  marker,
}: {
  label: string;
  value: number;
  variant?: RowVariant;
  tag?: string;
  marker?: string;
}) {
  const isTotal = variant === "total";
  const isSubtotal = variant === "subtotal";
  const isSub = variant === "sub";
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-3 py-2.5",
        isTotal && "bg-[var(--primary)] text-[var(--on-primary)]",
        isSubtotal && "bg-[var(--surface-low)]",
        isSub && "pl-6",
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {marker ? (
          <span
            aria-hidden
            className="h-3.5 w-[3px] shrink-0 rounded-[1px]"
            style={{ background: marker }}
          />
        ) : isSub ? (
          <span aria-hidden className="text-[var(--outline)]">
            ·
          </span>
        ) : null}
        <span
          className={cn(
            "truncate",
            isTotal
              ? "text-[14px] font-semibold"
              : isSubtotal
                ? "text-[13.5px] font-semibold text-[var(--on-surface)]"
                : isSub
                  ? "text-[13px] text-[var(--on-surface-variant)]"
                  : "text-[13.5px] text-[var(--on-surface)]",
          )}
        >
          {label}
        </span>
        {tag ? (
          <span
            className={cn(
              "label-caps shrink-0 rounded-[2px] px-1.5 py-0.5 text-[9px]",
              isTotal
                ? "bg-white/20 text-white"
                : "bg-[rgba(95,163,130,0.15)] text-[#3f7a5e]",
            )}
          >
            {tag}
          </span>
        ) : null}
      </div>
      <span
        className={cn(
          "tabular shrink-0 text-right",
          isTotal
            ? "text-[15px] font-bold"
            : isSubtotal
              ? "text-[14px] font-semibold"
              : isSub
                ? "text-[13px] text-[var(--on-surface-variant)]"
                : "text-[13.5px] text-[var(--on-surface)]",
        )}
      >
        {formatMXN(value)}
      </span>
    </div>
  );
}

/**
 * Desglose de la operación. Totales de la orden; si hay varias piedras, además
 * el desglose por piedra (landed + servicio de cada una).
 */
export function BreakdownLedger({ quote, stones, marginLabel }: BreakdownLedgerProps) {
  const byId = new Map(stones.map((s) => [s.id, s]));
  const sum = (f: (l: Quote["lines"][number]) => number) =>
    quote.lines.reduce((s, l) => s + f(l), 0);

  const aduanaTotal = sum((l) => l.aduana);
  const igiTotal = sum((l) => l.igiAmt);
  const dtaTotal = sum((l) => l.dtaAmt);
  const agenteTotal = sum((l) => l.agenteShare);
  const multi = quote.lines.length > 1;

  return (
    <Card className="card-surface card-lift" data-animate="card">
      <CardHeader>
        <CardTitle>Desglose de la operación</CardTitle>
      </CardHeader>
      <CardBody className="px-3">
        {/* Desglose por piedra (solo multi-piedra) */}
        {multi ? (
          <div className="mb-4 flex flex-col gap-2 rounded-lg border border-[var(--hairline)] bg-[var(--surface-low)] p-3">
            <div className="label-caps px-1 text-[9px] text-[var(--outline)]">
              Por piedra
            </div>
            {quote.lines.map((l) => {
              const s = byId.get(l.stoneId);
              return (
                <div
                  key={l.stoneId}
                  className="flex items-center justify-between gap-3 px-1"
                >
                  <span className="tabular min-w-0 truncate text-[12.5px] text-[var(--on-surface)]">
                    {s ? `${s.carat.toFixed(2)} ct · ${s.shape}` : l.stoneId}
                    <span className="ml-1.5 text-[var(--outline)]">
                      ({l.marginPct}% servicio)
                    </span>
                  </span>
                  <span className="tabular shrink-0 text-[12.5px] font-medium text-[var(--on-surface)]">
                    {formatMXN(l.price)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="flex flex-col divide-y divide-[var(--hairline)]">
          <LedgerRow
            label="Costo de la piedra"
            value={quote.composition.stone}
            marker="var(--c-stone)"
          />
          <LedgerRow
            label="Flete + seguro internacional"
            value={quote.composition.logistics}
            marker="var(--c-logi)"
          />
          <LedgerRow label="Valor en aduana" value={aduanaTotal} variant="subtotal" />
          <LedgerRow label="Arancel (IGI)" value={igiTotal} variant="sub" marker="var(--c-aduana)" />
          <LedgerRow label="DTA" value={dtaTotal} variant="sub" marker="var(--c-aduana)" />
          <LedgerRow
            label="Honorarios agente aduanal"
            value={agenteTotal}
            variant="sub"
            marker="var(--c-aduana)"
          />
          <LedgerRow label="Costo aterrizado" value={quote.landedTotal} variant="subtotal" />
          <LedgerRow label={marginLabel} value={quote.marginAmt} marker="var(--c-servicio)" />
          <LedgerRow label="Precio de venta (sin IVA)" value={quote.price} variant="total" />
          <LedgerRow label="IVA trasladado (16%)" value={quote.ivaOut} tag="acreditable" />
        </div>
      </CardBody>
    </Card>
  );
}
