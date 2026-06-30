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
