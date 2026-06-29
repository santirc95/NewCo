"use client";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { formatMXN, type QuoteResult } from "@/lib/compute";
import type { View } from "@/components/simulator";

interface BreakdownLedgerProps {
  result: QuoteResult;
  view: View;
  /** Etiqueta de la línea de margen (cambia con la vista). */
  marginLabel: string;
}

type RowVariant = "item" | "sub" | "subtotal";

function LedgerRow({
  label,
  value,
  variant = "item",
  tag,
}: {
  label: string;
  value: number;
  variant?: RowVariant;
  tag?: string;
}) {
  const isSubtotal = variant === "subtotal";
  const isSub = variant === "sub";
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 py-2",
        isSubtotal &&
          "mt-0.5 rounded-lg bg-[var(--surface-2)] px-3 -mx-1 border border-[var(--border)]",
        isSub && "pl-5",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isSub ? (
          <span aria-hidden className="text-[var(--text-faint)]">
            ·
          </span>
        ) : null}
        <span
          className={cn(
            "truncate",
            isSubtotal
              ? "text-[13.5px] font-semibold text-[var(--text)]"
              : isSub
                ? "text-[13px] text-[var(--text-faint)]"
                : "text-[13.5px] text-[var(--text-muted)]",
          )}
        >
          {label}
        </span>
        {tag ? (
          <span className="shrink-0 rounded-full border border-[rgba(245,166,35,0.3)] bg-[rgba(245,166,35,0.08)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--amber)]">
            {tag}
          </span>
        ) : null}
      </div>
      <span
        className={cn(
          "tabular shrink-0 text-right",
          isSubtotal
            ? "text-[14px] font-semibold text-[var(--text)]"
            : isSub
              ? "text-[13px] text-[var(--text-muted)]"
              : "text-[13.5px] text-[var(--text)]",
        )}
      >
        {formatMXN(value)}
      </span>
    </div>
  );
}

/**
 * Desglose de la operación — ledger vertical. Orden y sub-líneas según spec.
 * La vista Cliente oculta IVA importación y la línea de margen.
 */
export function BreakdownLedger({
  result,
  view,
  marginLabel,
}: BreakdownLedgerProps) {
  const interna = view === "interna";
  return (
    <Card>
      <CardHeader>
        <CardTitle>Desglose de la operación</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="flex flex-col divide-y divide-[var(--border)]">
          <LedgerRow label="Costo de la piedra" value={result.stoneMxn} />
          <LedgerRow
            label="Flete + seguro internacional"
            value={result.composition.logistica}
          />
          <LedgerRow
            label="Valor en aduana"
            value={result.aduana}
            variant="subtotal"
          />
          <LedgerRow label="Arancel (IGI)" value={result.igiAmt} variant="sub" />
          <LedgerRow label="DTA" value={result.dtaAmt} variant="sub" />
          <LedgerRow
            label="Honorarios agente aduanal"
            value={result.agenteAmt}
            variant="sub"
          />
          <LedgerRow
            label="Costo aterrizado"
            value={result.landed}
            variant="subtotal"
          />
          {interna ? (
            <LedgerRow
              label="IVA importación"
              value={result.ivaImp}
              tag="acreditable"
            />
          ) : null}
          {interna ? (
            <LedgerRow label={marginLabel} value={result.marginAmt} />
          ) : null}
          <LedgerRow
            label="Precio de venta"
            value={result.price}
            variant="subtotal"
          />
          <LedgerRow
            label="IVA trasladado (16%)"
            value={result.ivaOut}
            tag="acreditable"
          />
        </div>
      </CardBody>
    </Card>
  );
}
