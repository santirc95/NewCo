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
  /** Nuevos usuarios por invitación requieren aprobación de admin. */
  approved: boolean;
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

/** enviada → señalada → confirmada → en_embarque | importando → entregada. */
export type ProposalStatus =
  | "enviada"
  | "señalada"
  | "confirmada"
  | "en_embarque"
  | "importando"
  | "entregada";

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
  /** Orden directa del joyero (para stock/sí mismo) — sin cliente final. */
  direct?: boolean;
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

/** Etapas de trazabilidad de una orden (v4.1 — dos pagos por adelantado). */
export type OrderStage =
  | "confirmada"
  | "pago_piedra" // Pago 1: el costo de la piedra (con esto NewCo compra)
  | "comprada_proveedor"
  | "en_embarque"
  | "pago_logistica" // Pago 2: saldo logístico congelado al corte
  | "pendiente_logistica" // 3 rebotes sin cubrir logística → gestión admin
  | "en_transito"
  | "en_aduana"
  | "nacionalizado"
  | "entregado";

export interface OrderStatus {
  stage: OrderStage;
  at: string;
  note?: string;
}

/** Método de importación elegido tras confirmar la orden. */
export type ImportMethod = "directa" | "consolidada";

/**
 * Tabla "Pedidos" — el PEDIDO del joyero: agrupa sus piedras confirmadas
 * (pueden venir de varias propuestas) con su total. Distinto de Proposal,
 * que es la curaduría a UN cliente final.
 */
export interface Pedido {
  id: string;
  jewelerId: string;
  orderIds: string[];
  totalUsd: number;
  createdAt: string;
}

/**
 * Tabla "Ordenes" — UNA piedra CONFIRMADA a importar. Snapshots inmutables +
 * trazabilidad. Alimenta el programa de lealtad (Cap.2).
 */
export interface Order {
  id: string;
  jewelerId: string;
  proposalId: string;
  /** Pedido del joyero al que pertenece esta piedra. */
  pedidoId?: string;
  stoneSnapshot: Partial<Stone>;
  quoteSnapshot: Quote;
  totalUsd: number;
  /** Hold vigente mientras el joyero decide el método (puente corto). */
  holdId?: string;
  importMethod?: ImportMethod;
  /** Si va consolidada, el embarque al que pertenece. */
  shipmentId?: string;
  jewelerPaymentRef?: string;
  folio?: string; // folio de factura secuencial e inmutable al emitir
  /** Pago 2 realizado: logística confirmada y pagada (al corte). */
  finalCostConfirmed?: boolean;
  /** Veces que la piedra rebotó de embarque sin cubrir logística (límite 3). */
  reboteCount?: number;
  tracking: OrderStatus[];
  createdAt: string;
}

/* ------------------------------- embarques -------------------------------- */

export type ShipmentStatus = "abierto" | "cerrado" | "en_transito" | "entregado";

/** Escalón de llenado: rango de piedras → costo logístico aprox. por pieza. */
export interface ShipmentTier {
  minStones: number;
  maxStones: number | null; // null = sin tope
  costPerStoneMxn: number;
}

/** Tabla "Embarques" — el barco semanal (ES un simulador vivo). */
export interface Shipment {
  id: string;
  weekLabel: string;
  /** Corte semanal (editable por admin). */
  cutoffAt: string;
  status: ShipmentStatus;
  /** Órdenes CANDIDATAS (de varios joyeros). */
  orderIds: string[];
  /** Órdenes con logística PAGADA — las únicas que entran al cierre atómico. */
  paidLogisticsOrderIds: string[];
  /** Escalones de llenado (configurables por admin). */
  tiers: ShipmentTier[];
  /** Costos fijos congelados al cierre (con el nº real de piedras pagadas). */
  frozenLogiMxn?: number;
  frozenAgenteMxn?: number;
}

/** Tabla "Config" — leyendas y corte, editables por admin. NO hardcodear. */
export interface Settings {
  shipmentDayLabel: string; // ej. "Pedidos de importación: cada jueves"
  transitWeeks: string; // ej. "Importación de 2 a 3 semanas"
  cutoffDayOfWeek: number; // 0=domingo … 4=jueves
}
