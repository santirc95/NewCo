/** Secciones del portal del joyero. Fuente única para el menú y el sidebar. */
export interface PortalSection {
  href: string;
  label: string;
  /** Aún no construida (Fase E/F) — se muestra como "próximamente". */
  soon?: boolean;
}

export const PORTAL_SECTIONS: PortalSection[] = [
  { href: "/portal/facturacion", label: "Facturación" },
  { href: "/portal/compras", label: "Compras" },
  { href: "/favoritos", label: "Favoritos" },
  { href: "/portal/direcciones", label: "Direcciones" },
  { href: "/portal/pagos", label: "Métodos de pago" },
  { href: "/portal/branding", label: "Branding" },
  { href: "/portal/password", label: "Contraseña" },
];
