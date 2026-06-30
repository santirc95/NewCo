"use client";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { formatMXN, type QuoteResult } from "@/lib/compute";

interface BreakdownLedgerProps {
  result: QuoteResult;
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
  const isTotal = variant === "total"; // fila negra (firma terminal-brutalista)
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
                : "border border-[var(--hairline)] text-[var(--on-surface-variant)]",
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
 * Desglose de la operación — ledger vertical (vista única del joyero).
 * Muestra el servicio de NewCo y construye hasta el precio con IVA.
 */
export function BreakdownLedger({ result, marginLabel }: BreakdownLedgerProps) {
  return (
    <Card className="card-surface card-lift" data-animate="card">
      <CardHeader>
        <CardTitle>Desglose de la operación</CardTitle>
      </CardHeader>
      <CardBody className="px-3">
        <div className="flex flex-col divide-y divide-[var(--hairline)]">
          <LedgerRow
            label="Costo de la piedra"
            value={result.stoneMxn}
            marker="var(--c-stone)"
          />
          <LedgerRow
            label="Flete + seguro internacional"
            value={result.composition.logistica}
            marker="var(--c-logi)"
          />
          <LedgerRow
            label="Valor en aduana"
            value={result.aduana}
            variant="subtotal"
          />
          <LedgerRow
            label="Arancel (IGI)"
            value={result.igiAmt}
            variant="sub"
            marker="var(--c-aduana)"
          />
          <LedgerRow
            label="DTA"
            value={result.dtaAmt}
            variant="sub"
            marker="var(--c-aduana)"
          />
          <LedgerRow
            label="Honorarios agente aduanal"
            value={result.agenteAmt}
            variant="sub"
            marker="var(--c-aduana)"
          />
          <LedgerRow
            label="Costo aterrizado"
            value={result.landed}
            variant="subtotal"
          />
          <LedgerRow
            label={marginLabel}
            value={result.marginAmt}
            marker="var(--c-servicio)"
          />
          <LedgerRow
            label="Precio de venta (sin IVA)"
            value={result.price}
            variant="total"
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
