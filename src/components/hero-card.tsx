"use client";

import { formatMXN } from "@/lib/compute";
import type { Quote } from "@/lib/types";
import { AnimatedNumber } from "@/components/animated-number";

interface HeroCardProps {
  allin: number;
  price: number;
  composition: Quote["composition"];
  /** Etiqueta del 4º segmento (servicio NewCo). */
  servicioLabel: string;
  /** Etiqueta del número héroe (default: precio all-in al joyero). */
  label?: string;
  /** Línea de apoyo bajo el número (default: sin IVA + acreditación). */
  subline?: React.ReactNode;
}

const HERO_SEGMENTS: {
  key: keyof Quote["composition"];
  color: string;
}[] = [
  { key: "stone", color: "var(--h-stone)" },
  { key: "logistics", color: "var(--h-logi)" },
  { key: "customs", color: "var(--h-aduana)" },
  { key: "service", color: "var(--h-servicio)" },
];

/**
 * Número héroe: única superficie oscura (mesh champán) sobre el papel marfil.
 * Hero = lo que el joyero paga a NewCo (all-in con IVA).
 */
export function HeroCard({
  allin,
  price,
  composition,
  servicioLabel,
  label = "Precio all-in al joyero",
  subline,
}: HeroCardProps) {
  const denom = price > 0 ? price : 1;
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
            {label}
          </span>
          <AnimatedNumber
            value={allin}
            format={formatMXN}
            className="tabular mt-3 block text-[clamp(2.4rem,6vw,3.4rem)] font-bold leading-none tracking-[-0.02em] text-white"
          />
          <div className="mt-3 flex flex-wrap items-baseline gap-x-2 text-[13px] text-white/65">
            {subline ?? (
              <>
                <span className="flex items-baseline gap-1">
                  Sin IVA:{" "}
                  <AnimatedNumber
                    value={price}
                    format={formatMXN}
                    className="tabular text-white/90"
                  />
                </span>
                <span aria-hidden className="text-white/35">
                  ·
                </span>
                <span>el IVA se acredita</span>
              </>
            )}
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
              const pct = composition[seg.key] / denom;
              const label = seg.key === "service" ? servicioLabel : seg.key;
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
