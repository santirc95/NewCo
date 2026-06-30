"use client";

import { Card, CardBody } from "@/components/ui/primitives";
import { formatMXN } from "@/lib/compute";
import { AnimatedNumber } from "@/components/animated-number";

interface IvaExplainerProps {
  /** Precio all-in (con IVA) — lo que desembolsa el joyero. */
  allin: number;
  /** IVA trasladado — el monto acreditable que se recupera. */
  ivaOut: number;
  /** Precio sin IVA — el costo real. */
  price: number;
}

function Row({
  label,
  value,
  format = formatMXN,
  emphasis,
  strong,
  muted,
  chip,
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
  emphasis?: boolean;
  strong?: boolean;
  muted?: boolean;
  chip?: string;
}) {
  const labelClass = emphasis
    ? "text-[14px] font-semibold text-[var(--on-surface)]"
    : strong
      ? "text-[13.5px] font-medium text-[var(--on-surface)]"
      : muted
        ? "text-[13.5px] text-[var(--on-surface-variant)]"
        : "text-[13.5px] text-[var(--on-surface)]";

  const valueClass = emphasis
    ? "tabular text-[18px] font-bold text-[var(--warn-text)]"
    : strong
      ? "tabular text-[14px] font-semibold text-[var(--on-surface)]"
      : muted
        ? "tabular text-[13.5px] text-[var(--on-surface-variant)]"
        : "tabular text-[13.5px] text-[var(--on-surface)]";

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className={labelClass}>{label}</span>
        {chip ? (
          <span className="label-caps rounded-[2px] bg-[var(--warn-bg)] px-1.5 py-0.5 text-[9px] text-[var(--warn-text)]">
            {chip}
          </span>
        ) : null}
      </div>
      <AnimatedNumber
        value={value}
        format={format}
        duration={0.5}
        className={valueClass}
      />
    </div>
  );
}

/**
 * "El IVA no es un costo" — bloque didáctico. Aclara, en lenguaje llano, que el
 * IVA es acreditable (se recupera) y que el costo real es el precio sin IVA.
 * Pensado para audiencia sin cultura fiscal; visible en ambas vistas.
 */
export function IvaExplainer({ allin, ivaOut, price }: IvaExplainerProps) {
  return (
    <Card className="card-surface card-lift overflow-hidden" data-animate="card">
      {/* acento champán superior — señala "léeme" sin gritar */}
      <div
        aria-hidden
        className="h-[3px] w-full"
        style={{
          background:
            "linear-gradient(90deg, var(--gold), var(--gold-soft) 40%, transparent)",
        }}
      />
      <CardBody className="pt-5">
        <div className="flex items-center gap-2">
          <InfoIcon />
          <h3 className="label-caps text-[11px] text-[var(--warn-text)]">
            El IVA no es un costo
          </h3>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <Row label="Tu costo real (sin IVA)" value={price} strong />
          <Row
            label="IVA que acreditas (16%)"
            value={ivaOut}
            format={(n) => `+${formatMXN(n)}`}
            chip="lo recuperas"
            muted
          />
          <div className="border-t border-[var(--hairline)]" />
          <Row label="Precio con IVA · lo que pagas" value={allin} emphasis />
        </div>

        <p className="mt-4 text-[12.5px] leading-relaxed text-[var(--on-surface-variant)]">
          El IVA que pagas no se pierde: lo acreditas (lo restas) en tu
          declaración contra el IVA que les cobras a tus clientes. Por eso tu
          costo real es el precio <span className="whitespace-nowrap">sin IVA</span>.
        </p>
      </CardBody>
    </Card>
  );
}

function InfoIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--warn-text)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
