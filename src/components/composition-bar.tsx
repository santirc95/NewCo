"use client";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/primitives";
import { formatMXN, formatPct } from "@/lib/compute";
import type { Quote } from "@/lib/types";
import { AnimatedNumber } from "@/components/animated-number";

interface CompositionBarProps {
  composition: Quote["composition"];
  price: number;
  /** Etiqueta del 4º segmento (servicio NewCo). */
  servicioLabel: string;
}

interface SegmentDef {
  key: keyof Quote["composition"];
  label: string;
  color: string;
}

/**
 * Barra de composición — segmentos proporcionales sobre el precio (sin IVA),
 * en la paleta de metales preciosos.
 */
export function CompositionBar({ composition, price, servicioLabel }: CompositionBarProps) {
  const denom = price > 0 ? price : 1;
  const segments: SegmentDef[] = [
    { key: "stone", label: "Piedra", color: "var(--c-stone)" },
    { key: "logistics", label: "Logística + seguro", color: "var(--c-logi)" },
    { key: "customs", label: "Aduana", color: "var(--c-aduana)" },
    { key: "service", label: servicioLabel, color: "var(--c-servicio)" },
  ];

  return (
    <Card className="card-surface card-lift" data-animate="card">
      <CardHeader>
        <CardTitle>Composición del precio · sin IVA</CardTitle>
      </CardHeader>
      <CardBody>
        <div
          className="grain relative flex h-4 w-full overflow-hidden rounded-full bg-[var(--surface-high)] ring-1 ring-[var(--hairline)]"
          role="img"
          aria-label="Distribución del precio por componente"
        >
          {segments.map((seg) => {
            const pct = composition[seg.key] / denom;
            return (
              <div
                key={seg.key}
                className="h-full transition-[flex-grow] duration-700 ease-out"
                style={{
                  flexGrow: Math.max(pct, 0),
                  flexBasis: 0,
                  minWidth: pct > 0 ? 3 : 0,
                  background: seg.color,
                }}
                title={`${seg.label}: ${formatPct(pct)}`}
              />
            );
          })}
        </div>

        <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {segments.map((seg) => (
            <li key={seg.key} className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                style={{ background: seg.color }}
              />
              <span className="flex-1 truncate text-[13px] text-[var(--on-surface-variant)]">
                {seg.label}
              </span>
              <AnimatedNumber
                value={composition[seg.key] / denom}
                format={formatPct}
                duration={0.5}
                className="tabular text-[13px] font-medium text-[var(--on-surface)]"
              />
              <span className="tabular hidden w-28 text-right text-[12px] text-[var(--outline)] sm:inline">
                {formatMXN(composition[seg.key])}
              </span>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
