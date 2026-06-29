"use client";

import { formatMXN, type QuoteResult } from "@/lib/compute";
import { AnimatedNumber } from "@/components/animated-number";

interface HeroCardProps {
  result: QuoteResult;
  /** Etiqueta del 4º segmento (cambia con la vista Interna/Cliente). */
  servicioLabel: string;
}

/** Segmentos de la barra embebida en el hero (paleta cálida sobre oscuro). */
const HERO_SEGMENTS: {
  key: keyof QuoteResult["composition"];
  color: string;
}[] = [
  { key: "piedra", color: "var(--h-stone)" },
  { key: "logistica", color: "var(--h-logi)" },
  { key: "aduana", color: "var(--h-aduana)" },
  { key: "servicio", color: "var(--h-servicio)" },
];

/**
 * Número héroe: única superficie oscura (mesh champán tipo diamante refractivo)
 * sobre el papel marfil. Lleva la barra de distribución de costos, como Stitch.
 */
export function HeroCard({ result, servicioLabel }: HeroCardProps) {
  return (
    <div
      className="hero-card grain relative overflow-hidden rounded-xl"
      style={{ boxShadow: "var(--shadow-hero)" }}
      data-animate="card"
    >
      <div className="gradient-mesh absolute inset-0 opacity-95" aria-hidden />
      <div className="relative flex h-full flex-col justify-between gap-8 p-8 text-white">
        <div>
          <span className="label-caps text-[11px] text-[var(--h-servicio)]/90">
            Precio all-in al joyero
          </span>
          <AnimatedNumber
            value={result.allin}
            format={formatMXN}
            className="tabular mt-3 block text-[clamp(2.4rem,6vw,3.4rem)] font-bold leading-none tracking-[-0.02em] text-white"
          />
          <div className="mt-3 flex flex-wrap items-baseline gap-x-2 text-[13px] text-white/65">
            <span className="flex items-baseline gap-1">
              Sin IVA:{" "}
              <AnimatedNumber
                value={result.price}
                format={formatMXN}
                className="tabular text-white/90"
              />
            </span>
            <span aria-hidden className="text-white/35">
              ·
            </span>
            <span>el IVA se acredita</span>
          </div>
        </div>

        <div>
          <span className="label-caps text-[10px] text-white/55">
            Composición del costo
          </span>
          <div
            className="mt-2 flex h-4 w-full overflow-hidden rounded-full bg-white/12 ring-1 ring-white/10"
            role="img"
            aria-label="Distribución del costo por componente"
          >
            {HERO_SEGMENTS.map((seg) => {
              const pct = result.compositionPct[seg.key];
              const label = seg.key === "servicio" ? servicioLabel : seg.key;
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
                  title={`${label}: ${(pct * 100).toFixed(1)}%`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
