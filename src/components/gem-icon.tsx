import type { Shape } from "@/lib/types";

/** Diamante SVG por forma, en champán/marfil — pensado sobre tile oscuro. */
export function GemIcon({ shape, size = 58 }: { shape: Shape; size?: number }) {
  const g = "#e8dcc0"; // cuerpo cálido
  const s = "#c9a86a"; // contorno champán
  const l = "#fbf6ea"; // brillo

  const shapes: Record<Shape, string> = {
    Redondo: `<circle r="20" fill="${g}"/><circle r="20" fill="none" stroke="${s}" stroke-width="1"/><polygon points="0,-12 10,-4 6,9 -6,9 -10,-4" fill="${l}" opacity=".55"/><circle r="6" fill="${l}" opacity=".4"/>`,
    Óvalo: `<ellipse rx="14" ry="20" fill="${g}"/><ellipse rx="14" ry="20" fill="none" stroke="${s}" stroke-width="1"/><polygon points="0,-13 8,-3 5,11 -5,11 -8,-3" fill="${l}" opacity=".5"/>`,
    Cojín: `<rect x="-18" y="-18" width="36" height="36" rx="11" fill="${g}"/><rect x="-18" y="-18" width="36" height="36" rx="11" fill="none" stroke="${s}" stroke-width="1"/><polygon points="0,-11 10,0 0,11 -10,0" fill="${l}" opacity=".5"/>`,
    Esmeralda: `<rect x="-13" y="-20" width="26" height="40" rx="5" fill="${g}"/><rect x="-13" y="-20" width="26" height="40" rx="5" fill="none" stroke="${s}" stroke-width="1"/><line x1="-8" y1="-13" x2="8" y2="-13" stroke="${l}" stroke-width="1.5" opacity=".5"/><line x1="-8" y1="0" x2="8" y2="0" stroke="${l}" stroke-width="1.5" opacity=".5"/><line x1="-8" y1="13" x2="8" y2="13" stroke="${l}" stroke-width="1.5" opacity=".5"/>`,
    Pera: `<path d="M0,-22 C12,-8 12,8 0,20 C-12,8 -12,-8 0,-22 Z" fill="${g}"/><path d="M0,-22 C12,-8 12,8 0,20 C-12,8 -12,-8 0,-22 Z" fill="none" stroke="${s}" stroke-width="1"/><polygon points="0,-12 6,2 0,12 -6,2" fill="${l}" opacity=".5"/>`,
    Princesa: `<rect x="-17" y="-17" width="34" height="34" rx="2" fill="${g}"/><rect x="-17" y="-17" width="34" height="34" rx="2" fill="none" stroke="${s}" stroke-width="1"/><polygon points="0,-17 17,0 0,17 -17,0" fill="none" stroke="${l}" stroke-width="1" opacity=".5"/><polygon points="0,-9 9,0 0,9 -9,0" fill="${l}" opacity=".4"/>`,
    Marquesa: `<path d="M0,-24 C10,-8 10,8 0,24 C-10,8 -10,-8 0,-24 Z" fill="${g}"/><path d="M0,-24 C10,-8 10,8 0,24 C-10,8 -10,-8 0,-24 Z" fill="none" stroke="${s}" stroke-width="1"/><polygon points="0,-14 6,0 0,14 -6,0" fill="${l}" opacity=".5"/>`,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="-26 -26 52 52"
      aria-hidden
      dangerouslySetInnerHTML={{ __html: shapes[shape] ?? shapes.Redondo }}
    />
  );
}

/** Tile oscuro tipo "vitrina" donde se posa la gema. */
export function GemTile({
  shape,
  size = 58,
  className = "",
}: {
  shape: Shape;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl ${className}`}
      style={{
        background:
          "radial-gradient(circle at 50% 36%, #2a2118, #14100b 72%)",
        boxShadow: "inset 0 1px 0 rgba(232,220,192,0.06)",
      }}
    >
      <span style={{ filter: "drop-shadow(0 2px 10px rgba(201,168,106,0.22))" }}>
        <GemIcon shape={shape} size={size} />
      </span>
    </div>
  );
}
