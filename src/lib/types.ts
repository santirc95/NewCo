/**
 * Modelo de datos compartido entre superficies (inventario y propuesta).
 * En v1 los datos vienen de mocks; los tipos son el contrato estable para
 * conectar la API real del proveedor y el store de propuestas en v2.
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
  color: string; // D, E, F, ...
  clarity: string; // FL, IF, VVS1, VVS2, VS1, VS2, SI1...
  cut: Cut;
  lab: Lab;
  type: DiamondType;
  /** Costo del proveedor en USD — alimenta computeQuote para el precio all-in. */
  supplierPriceUsd: number;
  /** La API real trae foto/video; en mock queda undefined. */
  photoUrl?: string;
  /** Ventana de hold que concede el proveedor (ej. 48h). */
  holdWindowHours: number;
}

/** Marca editable del joyero (white-label). */
export interface JewelerBranding {
  /** Inicial o monograma para el sello. */
  logoText: string;
  name: string;
  tagline: string;
  address: string;
  advisorName: string;
}

export interface Jeweler {
  id: string;
  name: string;
  branding: JewelerBranding;
}

/**
 * Carga útil de una propuesta. En v1 se codifica en el token del link público
 * (sin backend); en v2 será un registro con token opaco en el servidor.
 */
export interface ProposalPayload {
  /** Snapshot de la marca del joyero al momento de generar el link. */
  jeweler: JewelerBranding;
  clientName: string;
  stoneIds: string[];
}

export type HoldStatus = "active" | "released" | "expired" | "converted";

/** Apartado de una piedra por el cliente final. */
export interface Hold {
  stoneId: string;
  customerPhone: string;
  consent: boolean;
  startedAt: number; // epoch ms
  expiresAt: number; // epoch ms — (expiresAt - startedAt) ≤ holdWindowHours
  status: HoldStatus;
}
