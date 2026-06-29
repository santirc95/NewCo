"use client";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/primitives";
import { formatMXN, formatPct, type QuoteResult } from "@/lib/compute";

interface CompositionBarProps {
  result: QuoteResult;
  /** Etiqueta del 4º segmento (cambia con la vista Interna/Cliente). */
  servicioLabel: string;
}

interface SegmentDef {
  key: keyof QuoteResult["composition"];
  label: string;
  color: string;
}

/**
 * Barra de composición — segmentos proporcionales sobre el precio (sin IVA),
 * con la paleta categórica de Stitch (onyx / azul / lavanda / naranja).
 */
export function CompositionBar({ result, servicioLabel }: CompositionBarProps) {
  const segments: SegmentDef[] = [
    { key: "piedra", label: "Piedra", color: "var(--on-surface)" },
    {
      key: "logistica",
      label: "Logística + seguro",
      color: "var(--chart-blue)",
    },
    { key: "aduana", label: "Aduana", color: "var(--chart-lavender)" },
    { key: "servicio", label: servicioLabel, color: "var(--chart-orange)" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Composición del precio · sin IVA</CardTitle>
      </CardHeader>
      <CardBody>
        {/* Barra */}
        <div
          className="grain relative flex h-4 w-full overflow-hidden rounded-full bg-[var(--surface-high)]"
          role="img"
          aria-label="Distribución del precio por componente"
        >
          {segments.map((seg) => {
            const pct = result.compositionPct[seg.key];
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

        {/* Leyenda */}
        <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {segments.map((seg) => (
            <li key={seg.key} className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                style={{ background: seg.color }}
              />
              <span className="flex-1 truncate text-[13px] text-[var(--on-surface-variant)]">
                {seg.label}
              </span>
              <span className="tabular text-[13px] font-medium text-[var(--on-surface)]">
                {formatPct(result.compositionPct[seg.key])}
              </span>
              <span className="tabular hidden w-28 text-right text-[12px] text-[var(--outline)] sm:inline">
                {formatMXN(result.composition[seg.key])}
              </span>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
