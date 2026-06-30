"use client";

import { useId } from "react";
import type { Shape } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/* Diamante SVG facetado y realista (sin red).                                */
/* La clave de realismo: sombreado direccional de facetas (luz arriba-izq),   */
/* mesa reflejante, destellos y un toque de dispersión ("fuego").             */
/* En v2, si la piedra trae `photoUrl`, se usa la foto real en su lugar.      */
/* -------------------------------------------------------------------------- */

type OutlineSpec =
  | { tag: "circle"; r: number }
  | { tag: "ellipse"; rx: number; ry: number }
  | { tag: "rect"; x: number; y: number; w: number; h: number; rx: number }
  | { tag: "path"; d: string };

function outlineSpec(shape: Shape): OutlineSpec {
  switch (shape) {
    case "Redondo":
      return { tag: "circle", r: 23 };
    case "Óvalo":
      return { tag: "ellipse", rx: 15, ry: 23 };
    case "Cojín":
      return { tag: "rect", x: -20, y: -20, w: 40, h: 40, rx: 13 };
    case "Princesa":
      return { tag: "rect", x: -20, y: -20, w: 40, h: 40, rx: 2 };
    case "Esmeralda":
      return { tag: "rect", x: -15, y: -22, w: 30, h: 44, rx: 4 };
    case "Pera":
      return { tag: "path", d: "M0,-24 C13,-9 13,9 0,22 C-13,9 -13,-9 0,-24 Z" };
    case "Marquesa":
      return { tag: "path", d: "M0,-25 C11,-9 11,9 0,25 C-11,9 -11,-9 0,-25 Z" };
  }
}

function Outline({
  spec,
  fill = "none",
  stroke,
  strokeWidth,
  opacity,
}: {
  spec: OutlineSpec;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}) {
  const p = { fill, stroke, strokeWidth, opacity };
  switch (spec.tag) {
    case "circle":
      return <circle cx={0} cy={0} r={spec.r} {...p} />;
    case "ellipse":
      return <ellipse cx={0} cy={0} rx={spec.rx} ry={spec.ry} {...p} />;
    case "rect":
      return (
        <rect
          x={spec.x}
          y={spec.y}
          width={spec.w}
          height={spec.h}
          rx={spec.rx}
          {...p}
        />
      );
    case "path":
      return <path d={spec.d} {...p} />;
  }
}

/** Punto en coordenadas SVG a radio r y ángulo deg (0 = arriba). */
function pt(r: number, deg: number): string {
  const a = ((deg - 90) * Math.PI) / 180;
  return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
}

const DARK: [number, number, number] = [66, 80, 93];
const LIGHT: [number, number, number] = [236, 243, 249];
// Dirección de la luz (arriba-izquierda)
const LX = -0.55;
const LY = -0.83;

function mix(a: number[], b: number[], t: number): string {
  const c = (i: number) => Math.round(a[i] + (b[i] - a[i]) * t);
  return `rgb(${c(0)},${c(1)},${c(2)})`;
}

/** Color de faceta según el ángulo de su normal vs la luz. */
function facetColor(midDeg: number, boost = 0): string {
  const a = ((midDeg - 90) * Math.PI) / 180;
  const nx = Math.cos(a);
  const ny = Math.sin(a);
  const dot = nx * LX + ny * LY; // -1..1
  const t = Math.max(0, Math.min(1, (dot + 1) / 2 + boost));
  return mix(DARK, LIGHT, t);
}

function Star({ cx, cy, s, opacity }: { cx: number; cy: number; s: number; opacity: number }) {
  const k = s * 0.16;
  const d = `M${cx},${cy - s} L${cx + k},${cy - k} L${cx + s},${cy} L${cx + k},${cy + k} L${cx},${cy + s} L${cx - k},${cy + k} L${cx - s},${cy} L${cx - k},${cy - k} Z`;
  return <path d={d} fill="#ffffff" opacity={opacity} />;
}

export function GemIcon({ shape, size = 58 }: { shape: Shape; size?: number }) {
  const raw = useId();
  const uid = raw.replace(/[:]/g, "");
  const spec = outlineSpec(shape);

  const N = 16;
  const step = 360 / N;
  const facets = Array.from({ length: N }, (_, i) => {
    const a0 = i * step;
    const a1 = (i + 1) * step;
    const color = facetColor((a0 + a1) / 2);
    return (
      <polygon
        key={i}
        points={`0,0 ${pt(30, a0)} ${pt(30, a1)}`}
        fill={color}
        stroke="rgba(20,28,36,0.18)"
        strokeWidth={0.4}
      />
    );
  });

  // Mesa central (octágono) con sus facetas internas
  const tableR = 8.4;
  const tableVerts = Array.from({ length: 8 }, (_, i) => pt(tableR, i * 45 + 22.5));
  const tablePts = tableVerts.join(" ");
  const tableFacets = Array.from({ length: 8 }, (_, i) => {
    const a0 = i * 45 + 22.5;
    const a1 = (i + 1) * 45 + 22.5;
    const color = facetColor((a0 + a1) / 2, 0.18);
    return (
      <polygon key={i} points={`0,0 ${pt(tableR, a0)} ${pt(tableR, a1)}`} fill={color} opacity={0.92} />
    );
  });

  return (
    <svg width={size} height={size} viewBox="-28 -28 56 56" aria-hidden>
      <defs>
        <clipPath id={`clip-${uid}`}>
          <Outline spec={spec} fill="#fff" />
        </clipPath>
        <radialGradient id={`base-${uid}`} cx="0.4" cy="0.34" r="0.78">
          <stop offset="0" stopColor="#eff5fa" />
          <stop offset="1" stopColor="#9aabb8" />
        </radialGradient>
        <linearGradient id={`tbl-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f5fafd" />
          <stop offset="1" stopColor="#c2cfd9" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#clip-${uid})`}>
        <Outline spec={spec} fill={`url(#base-${uid})`} />
        {facets}

        {/* Fuego / dispersión — facetas teñidas muy sutiles */}
        <polygon points={`0,0 ${pt(30, 210)} ${pt(30, 232)}`} fill="#7fd4ff" opacity={0.16} />
        <polygon points={`0,0 ${pt(30, 62)} ${pt(30, 84)}`} fill="#ffce80" opacity={0.15} />
        <polygon points={`0,0 ${pt(30, 300)} ${pt(30, 322)}`} fill="#ffa6e0" opacity={0.1} />

        {/* Mesa reflejante */}
        <polygon points={tablePts} fill={`url(#tbl-${uid})`} />
        {tableFacets}
        <polygon
          points={tablePts}
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={0.5}
        />

        {/* Cortes de paso (esmeralda) / cruz (princesa) */}
        {shape === "Esmeralda" ? (
          <g stroke="rgba(210,222,232,0.55)" strokeWidth={0.7} fill="none">
            <rect x={-11} y={-18} width={22} height={36} rx={3} />
            <rect x={-7.5} y={-13} width={15} height={26} rx={2} />
          </g>
        ) : null}
        {shape === "Princesa" ? (
          <g stroke="rgba(210,222,232,0.5)" strokeWidth={0.7}>
            <line x1={-19} y1={-19} x2={19} y2={19} />
            <line x1={19} y1={-19} x2={-19} y2={19} />
          </g>
        ) : null}

        {/* Destellos */}
        <circle cx={-7} cy={-9} r={5} fill="#ffffff" opacity={0.14} />
        <Star cx={-7} cy={-9} s={4.2} opacity={0.95} />
        <Star cx={8.5} cy={3} s={2.4} opacity={0.75} />
        <Star cx={2} cy={10} s={1.7} opacity={0.6} />
      </g>

      {/* Contorno (girdle) */}
      <Outline spec={spec} fill="none" stroke="#d9c49b" strokeWidth={1.1} />
      <Outline spec={spec} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={0.4} />
    </svg>
  );
}

/** Tile oscuro tipo "vitrina" donde se posa la gema (o la foto real). */
export function GemTile({
  shape,
  size = 58,
  photoUrl,
  className = "",
}: {
  shape: Shape;
  size?: number;
  /** Foto real de la piedra (v2). Si existe, se usa en lugar del SVG. */
  photoUrl?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-xl ${className}`}
      style={{
        background: "radial-gradient(circle at 50% 36%, #2a2118, #14100b 72%)",
        boxShadow: "inset 0 1px 0 rgba(232,220,192,0.06)",
      }}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <span style={{ filter: "drop-shadow(0 2px 12px rgba(201,168,106,0.22))" }}>
          <GemIcon shape={shape} size={size} />
        </span>
      )}
    </div>
  );
}
