/**
 * Modelo de datos — Etapa 1.
 *
 * NewCo es el PRINCIPAL: le vende el diamante importado al joyero. El cliente
 * final solo ve y señala (capa de presentación, sin precio ni pago).
 * Los tipos son el contrato estable; en Cap.2 se conectan API/Airtable reales.
 */

export type Shape =
  | "Redondo"
  | "Óvalo"
  | "Cojín"
  | "Esmeralda"
  | "Pera"
  | "Princesa"
  | "Marquesa";

/** Roles del sistema. Permisos validados en el servidor. */
export type Role = "jeweler" | "admin";

/** Perfil del joyero. Parte editable por él; parte administrada por NewCo. */
export interface Jeweler {
  id: string;
  // Editable por el JOYERO:
  name: string;
  legalName: string;
  rfc: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  branding?: { logoText: string }; // white-label = Cap.2
  // Administrado por NEWCO (el joyero NO lo edita):
  active: boolean;
  createdAt: string;
}

/** Banda de margen GLOBAL por valor de piedra (USD). Administrada por NewCo. */
export interface MarginBand {
  id: string;
  minValueUsd: number;
  maxValueUsd: number | null; // null = sin tope superior
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

/** Entrada de una línea de cotización (piedra + su margen ya resuelto). */
export interface QuoteLineInput {
  stoneId: string;
  supplierPriceUsd: number;
  marginPct: number;
}

/** Cálculo por piedra dentro de una orden. */
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

/** Cotización de una orden (1+ piedras). */
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

export type DiamondType = "natural" | "lab";
export type Lab = "GIA" | "IGI";
/** Corte: Excelente / Muy buena / Buena. */
export type Cut = "EX" | "VG" | "G";

/** Una piedra del inventario del proveedor (vendría de su API). */
export interface Stone {
  id: string;
  certNumber: string;
  shape: Shape;
  carat: number;
  color: string;
  clarity: string;
  cut: Cut;
  lab: Lab;
  type: DiamondType;
  /** Costo del proveedor en USD — alimenta computeQuote. */
  supplierPriceUsd: number;
  /** La API real trae foto/video; en mock queda undefined. */
  photoUrl?: string;
  /** Ventana de hold del proveedor (dato real tras negociación). */
  holdWindowHours: number;
}

/** enviada → señalada → en_hold → pagada → ordenada. */
export type ProposalStatus =
  | "enviada"
  | "señalada"
  | "en_hold"
  | "pagada"
  | "ordenada";

/** Propuesta que el joyero arma y comparte con su cliente final. */
export interface Proposal {
  id: string;
  token: string; // link público impredecible
  clientName: string; // lo captura el joyero
  stoneIds: string[]; // 1–4 piedras curadas
  signaledStoneId?: string; // la que el cliente final señaló
  /** WhatsApp del joyero (dígitos) para el aviso click-to-chat del cliente. */
  jewelerWhatsapp?: string;
  createdAt: string;
  status: ProposalStatus;
}

export type HoldStatus = "active" | "released" | "expired" | "converted";

/** Apartado de una piedra — lo dispara el JOYERO. */
export interface Hold {
  id: string;
  proposalId: string;
  stoneId: string;
  startedAt: number; // epoch ms
  expiresAt: number; // epoch ms — (expiresAt - startedAt) ≤ stone.holdWindowHours
  status: HoldStatus;
}

/** Orden creada al confirmarse el pago del joyero a NewCo. */
export interface Order {
  id: string;
  proposalId: string;
  stoneId: string;
  jewelerPaymentRef: string;
  createdAt: string;
}
