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
  from: string;
  to: string;
}

/**
 * Barra de composición — elemento central. 4 segmentos proporcionales sobre el
 * precio (sin IVA), con gradientes de la familia oro escalonada. Permitido el
 * gradiente aquí (junto con el héroe); el resto de la UI es silencioso.
 */
export function CompositionBar({ result, servicioLabel }: CompositionBarProps) {
  const segments: SegmentDef[] = [
    {
      key: "piedra",
      label: "Piedra",
      from: "var(--seg-piedra-from)",
      to: "var(--seg-piedra-to)",
    },
    {
      key: "logistica",
      label: "Logística + seguro",
      from: "var(--seg-logi-from)",
      to: "var(--seg-logi-to)",
    },
    {
      key: "aduana",
      label: "Aduana",
      from: "var(--seg-aduana-from)",
      to: "var(--seg-aduana-to)",
    },
    {
      key: "servicio",
      label: servicioLabel,
      from: "var(--seg-servicio-from)",
      to: "var(--seg-servicio-to)",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Composición del precio · sin IVA</CardTitle>
      </CardHeader>
      <CardBody>
        {/* Barra */}
        <div
          className="flex h-5 w-full gap-[2px] overflow-hidden rounded-full bg-[var(--surface-3)] p-[2px]"
          role="img"
          aria-label="Distribución del precio por componente"
        >
          {segments.map((seg) => {
            const pct = result.compositionPct[seg.key];
            return (
              <div
                key={seg.key}
                className="h-full rounded-full transition-[flex-grow] duration-500 ease-out"
                style={{
                  flexGrow: Math.max(pct, 0),
                  flexBasis: 0,
                  minWidth: pct > 0 ? 4 : 0,
                  background: `linear-gradient(180deg, ${seg.from}, ${seg.to})`,
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
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  background: `linear-gradient(180deg, ${seg.from}, ${seg.to})`,
                }}
              />
              <span className="flex-1 truncate text-[13px] text-[var(--text-muted)]">
                {seg.label}
              </span>
              <span className="tabular text-[13px] font-medium text-[var(--text)]">
                {formatPct(result.compositionPct[seg.key])}
              </span>
              <span className="tabular hidden w-28 text-right text-[12px] text-[var(--text-faint)] sm:inline">
                {formatMXN(result.composition[seg.key])}
              </span>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
