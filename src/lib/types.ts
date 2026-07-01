/**
 * Modelo de datos — Etapa 1 v3.
 *
 * NewCo (importador de registro) le VENDE el diamante importado al joyero, con
 * CFDI y nacionalización resueltas. El cliente final solo ve y señala.
 *
 * Los datos de NewCo viven tras la capa de datos (`repo/`) — hoy en memoria,
 * mañana en Airtable. El inventario del proveedor NO vive aquí (viene de su API).
 */

export type Shape =
  | "Redondo"
  | "Óvalo"
  | "Cojín"
  | "Esmeralda"
  | "Pera"
  | "Princesa"
  | "Marquesa";

export type Role = "jeweler" | "admin";
export type DiamondType = "natural" | "lab";
export type Lab = "GIA" | "IGI";
export type Cut = "EX" | "VG" | "G";

/** Una piedra del inventario del proveedor (de su API; mock por ahora). */
export interface Stone {
  id: string;
  certNumber: string;
  shape: Shape;
  carat: number;
  color: string;
  clarity: string;
  cut: Cut;
  polish?: string;
  symmetry?: string;
  fluorescence?: string;
  measurements?: string;
  depthPct?: number;
  tablePct?: number;
  lab: Lab;
  type: DiamondType;
  origin?: string;
  /** Precio real de origen (USD) — NO editable a mano. */
  supplierPriceUsd: number;
  photoUrl?: string;
  videoUrl?: string;
  certUrl?: string;
  holdWindowHours: number;
}

/* ------------------------------- facturación ------------------------------ */

export interface DomicilioFiscal {
  calle: string;
  numExt: string;
  numInt?: string;
  colonia: string;
  municipio: string;
  estado: string;
  cp: string;
}

/** Perfil del joyero + datos CFDI 4.0. Tabla "Joyeros". */
export interface Jeweler {
  id: string;
  role: Role;
  name: string;
  // Facturación CFDI 4.0 (validar valores con contador):
  rfc: string;
  razonSocial: string;
  regimenFiscal: string;
  cpFiscal: string;
  usoCfdi: string;
  domicilioFiscal: DomicilioFiscal;
  branding?: { logoUrl?: string; logoText: string };
  // Administrado por NewCo:
  active: boolean;
  createdAt: string;
}

/** Campos que el joyero puede editar de su propio perfil. */
export type JewelerProfilePatch = Partial<
  Pick<
    Jeweler,
    | "name"
    | "rfc"
    | "razonSocial"
    | "regimenFiscal"
    | "cpFiscal"
    | "usoCfdi"
    | "domicilioFiscal"
  >
> & { branding?: { logoUrl?: string; logoText: string } };

/** Tabla "Direcciones" — varias por joyero. */
export interface ShippingAddress {
  id: string;
  jewelerId: string;
  label: string;
  calle: string;
  numExt: string;
  numInt?: string;
  colonia: string;
  municipio: string;
  estado: string;
  cp: string;
  isDefault: boolean;
}

/** Tabla "MetodosPago" — SIN datos crudos (solo token/referencia). */
export interface PaymentMethod {
  id: string;
  jewelerId: string;
  type: "card" | "spei";
  token?: string; // token del procesador — NUNCA el PAN
  reference?: string; // ref. SPEI — NUNCA datos sensibles crudos
  label: string;
  isDefault: boolean;
}

/** Tabla "Favoritos" — snapshot al marcar (el inventario es vivo). */
export interface Favorite {
  id: string;
  jewelerId: string;
  stoneId: string;
  certNumber: string;
  snapshot: Partial<Stone>;
  createdAt: string;
}

/* --------------------------------- cálculo -------------------------------- */

/** Banda de margen GLOBAL por valor de piedra (USD). Tabla "Bandas". */
export interface MarginBand {
  id: string;
  minValueUsd: number;
  maxValueUsd: number | null;
  marginPct: number;
}

/** Parámetros de operación de NewCo (globales). SIN margen, SIN precio de piedra. */
export interface OpParams {
  fx: number;
  logiMxn: number;
  igiPct: number;
  dtaPct: number;
  agenteMxn: number;
}

export interface QuoteLineInput {
  stoneId: string;
  supplierPriceUsd: number;
  marginPct: number;
}

export interface LineQuote {
  stoneId: string;
  stoneMxn: number;
  logiShare: number;
  aduana: number;
  igiAmt: number;
  dtaAmt: number;
  agenteShare: number;
  landed: number;
  marginPct: number;
  marginAmt: number;
  price: number;
}

export interface Quote {
  lines: LineQuote[];
  landedTotal: number;
  marginAmt: number;
  price: number;
  ivaImp: number;
  ivaOut: number;
  allin: number;
  float: number;
  composition: {
    stone: number;
    logistics: number;
    customs: number;
    service: number;
  };
}

/* -------------------------- propuestas / holds / órdenes ------------------ */

export type ProposalStatus =
  | "enviada"
  | "señalada"
  | "en_hold"
  | "pagada"
  | "ordenada";

/** Tabla "Propuestas". */
export interface Proposal {
  id: string;
  token: string;
  jewelerId: string;
  clientName: string;
  stoneIds: string[];
  signaledStoneId?: string;
  /** WhatsApp del joyero para el aviso click-to-chat del cliente. */
  jewelerWhatsapp?: string;
  createdAt: string;
  status: ProposalStatus;
}

export type HoldStatus = "active" | "released" | "expired" | "converted";

/** Tabla "Holds" — lo dispara el joyero. */
export interface Hold {
  id: string;
  proposalId: string;
  stoneIds: string[];
  startedAt: number; // epoch ms
  expiresAt: number; // epoch ms — ≤ min(holdWindowHours de las piedras)
  status: HoldStatus;
}

/** Etapas de trazabilidad de una orden. */
export type OrderStage =
  | "orden_creada"
  | "pago_confirmado"
  | "confirmado_proveedor"
  | "en_transito"
  | "en_aduana"
  | "nacionalizado"
  | "entregado";

export interface OrderStatus {
  stage: OrderStage;
  at: string;
  note?: string;
}

/** Tabla "Ordenes". Snapshots inmutables + trazabilidad. Alimenta lealtad (Cap.2). */
export interface Order {
  id: string;
  jewelerId: string;
  proposalId: string;
  stoneSnapshots: Partial<Stone>[];
  quoteSnapshot: Quote;
  totalUsd: number;
  jewelerPaymentRef: string;
  folio?: string; // folio de factura secuencial e inmutable al emitir
  tracking: OrderStatus[];
  createdAt: string;
}
