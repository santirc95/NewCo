"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

interface AnimatedNumberProps {
  /** Valor objetivo. */
  value: number;
  /** Formatea el número a string (p.ej. formatMXN). */
  format: (n: number) => string;
  className?: string;
  /** Duración del conteo en segundos. */
  duration?: number;
}

/**
 * Cifra con conteo animado (GSAP). Tweenea desde el valor previo hasta el nuevo;
 * en el primer montaje cuenta desde 0. Respeta prefers-reduced-motion: si está
 * activo, muestra el valor final sin animar.
 */
export function AnimatedNumber({
  value,
  format,
  className,
  duration = 0.7,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      // Sin animación si el usuario la rechaza o la pestaña está oculta (rAF
      // no dispara estando oculta y GSAP se congelaría a media cuenta): en un
      // simulador financiero el valor mostrado debe ser SIEMPRE el correcto.
      if (reduce || document.hidden) {
        el.textContent = format(value);
        prev.current = value;
        return;
      }

      const proxy = { v: prev.current };
      gsap.to(proxy, {
        v: value,
        duration,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = format(proxy.v);
        },
        onComplete: () => {
          el.textContent = format(value);
          prev.current = value;
        },
      });
    },
    { dependencies: [value] },
  );

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
