"use client";

import { formatMXN, type QuoteResult } from "@/lib/compute";

interface HeroCardProps {
  result: QuoteResult;
  /** Etiqueta del 4º segmento (cambia con la vista Interna/Cliente). */
  servicioLabel: string;
}

/** Segmentos de la barra embebida en el hero (paleta categórica sobre oscuro). */
const HERO_SEGMENTS: {
  key: keyof QuoteResult["composition"];
  color: string;
}[] = [
  { key: "piedra", color: "#ffffff" },
  { key: "logistica", color: "var(--chart-blue)" },
  { key: "aduana", color: "var(--chart-lavender)" },
  { key: "servicio", color: "var(--chart-orange)" },
];

/**
 * Número héroe: única superficie oscura (mesh ámbar tipo diamante refractivo)
 * sobre el papel claro. Lleva la barra de distribución de costos, como Stitch.
 */
export function HeroCard({ result, servicioLabel }: HeroCardProps) {
  return (
    <div className="hero-card grain relative overflow-hidden rounded-xl shadow-xl">
      <div className="gradient-mesh absolute inset-0 opacity-90" aria-hidden />
      <div className="relative flex h-full flex-col justify-between gap-8 p-8 text-white">
        <div>
          <span className="label-caps text-[11px] text-white/80">
            Precio all-in al joyero
          </span>
          <div className="tabular mt-3 text-[clamp(2.4rem,6vw,3.4rem)] font-semibold leading-none text-white">
            {formatMXN(result.allin)}
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-2 text-[13px] text-white/70">
            <span>
              Sin IVA:{" "}
              <span className="tabular text-white/90">
                {formatMXN(result.price)}
              </span>
            </span>
            <span aria-hidden className="text-white/40">
              ·
            </span>
            <span>el IVA se acredita</span>
          </div>
        </div>

        <div>
          <span className="label-caps text-[10px] text-white/60">
            Composición del costo
          </span>
          <div
            className="mt-2 flex h-4 w-full overflow-hidden rounded-full bg-white/15"
            role="img"
            aria-label="Distribución del costo por componente"
          >
            {HERO_SEGMENTS.map((seg, i) => {
              const pct = result.compositionPct[seg.key];
              const label =
                seg.key === "servicio" ? servicioLabel : undefined;
              return (
                <div
                  key={seg.key}
                  className="h-full transition-[flex-grow] duration-1000"
                  style={{
                    flexGrow: Math.max(pct, 0),
                    flexBasis: 0,
                    minWidth: pct > 0 ? 3 : 0,
                    background: seg.color,
                    opacity: 1 - i * 0.08,
                  }}
                  title={`${label ?? seg.key}: ${(pct * 100).toFixed(1)}%`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
