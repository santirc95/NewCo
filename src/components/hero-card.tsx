"use client";

import { formatMXN } from "@/lib/compute";

interface HeroCardProps {
  /** Precio all-in al joyero (con IVA). */
  allin: number;
  /** Precio sin IVA. */
  price: number;
}

/**
 * Número héroe: única tarjeta con gradiente protagonista (oro champán / ámbar
 * profundo sobre carbón). La audacia visual vive aquí.
 */
export function HeroCard({ allin, price }: HeroCardProps) {
  return (
    <div
      className="hero-card print-card relative overflow-hidden rounded-2xl border border-[rgba(230,201,138,0.22)] p-7"
      style={{
        background:
          "radial-gradient(130% 150% at 12% 8%, rgba(230,201,138,0.20), transparent 52%), linear-gradient(135deg, #2b1e0b 0%, #1d1408 46%, #110c06 100%)",
        boxShadow:
          "0 1px 0 0 rgba(230,201,138,0.18) inset, 0 30px 60px -30px rgba(0,0,0,0.85), 0 0 80px -40px rgba(230,201,138,0.4)",
      }}
    >
      {/* brillo superior sutil */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-48 w-72 opacity-60"
        style={{
          background:
            "radial-gradient(closest-side, rgba(240,217,163,0.25), transparent)",
        }}
      />
      <div className="relative">
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--gold)]">
          Precio all-in al joyero
        </div>
        <div className="tabular mt-3 text-[clamp(2.4rem,6vw,3.6rem)] font-semibold leading-none text-[#fbf1da]">
          {formatMXN(allin)}
        </div>
        <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px] text-[rgba(251,241,218,0.72)]">
          <span>
            Sin IVA:{" "}
            <span className="tabular text-[rgba(251,241,218,0.92)]">
              {formatMXN(price)}
            </span>
          </span>
          <span aria-hidden className="text-[rgba(251,241,218,0.4)]">
            ·
          </span>
          <span>el IVA se acredita</span>
        </div>
      </div>
    </div>
  );
}
