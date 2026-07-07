import type {
  Jeweler,
  JewelerProfilePatch,
  MarginBand,
  ShippingAddress,
  PaymentMethod,
  Favorite,
  Proposal,
  Hold,
  Order,
  OrderStage,
  ImportMethod,
  Shipment,
  ShipmentStatus,
  Settings,
  Quote,
  Stone,
} from "@/lib/types";
import { memoryRepo } from "./memory";
import { airtableRepo } from "./airtable";

/** Vista enriquecida de una propuesta para el seguimiento del joyero. */
export interface ProposalView {
  proposal: Proposal;
  hold: Hold | null;
  order: Order | null;
}

export interface CreateProposalInput {
  jewelerId: string;
  clientName: string;
  stoneIds: string[];
  jewelerWhatsapp?: string;
}

export interface ProposalPatch {
  clientName?: string;
  stoneIds?: string[];
  signaledStoneId?: string;
}

/** Confirmar la orden = piedra en firme + hold (aún SIN método ni pago). */
export interface ConfirmOrderInput {
  token: string;
  stoneId: string;
  stoneSnapshot: Partial<Stone>;
  quoteSnapshot: Quote; // cotización standalone provisional
  totalUsd: number;
}

/**
 * PAGO 1 (Opción A): al elegir método el joyero paga EL COSTO DE LA PIEDRA;
 * con eso NewCo compra al proveedor y se suelta el hold. Si es consolidada,
 * la orden entra al embarque (la logística se paga al corte — Pago 2). La
 * directa cubre piedra + logística en el mismo momento, ambos por adelantado.
 */
export interface PayOrderInput {
  orderId: string;
  method: ImportMethod;
  paymentRef: string;
  shipmentId?: string;
  /** Cotización al momento del pago (proyección si es consolidada). */
  quoteSnapshot?: Quote;
}

/**
 * Capa de datos de NewCo (v4). Toda la persistencia pasa por aquí para migrar
 * de memoria → Airtable sin reescribir la app. Métodos ASÍNCRONOS. El
 * inventario del proveedor NO vive aquí (viene de su API).
 */
export interface Repo {
  // Joyeros
  getJeweler(id: string): Promise<Jeweler | undefined>;
  listJewelers(): Promise<Jeweler[]>;
  createJeweler(data: Omit<Jeweler, "id" | "createdAt">): Promise<Jeweler>;
  updateJewelerProfile(
    id: string,
    patch: JewelerProfilePatch,
  ): Promise<Jeweler | undefined>;
  setJewelerActive(id: string, active: boolean): Promise<Jeweler | undefined>;
  setJewelerApproved(
    id: string,
    approved: boolean,
  ): Promise<Jeweler | undefined>;

  // Bandas de margen
  listBands(): Promise<MarginBand[]>;
  saveBands(bands: MarginBand[]): Promise<MarginBand[]>;

  // Config (leyendas / corte — editable por admin)
  getSettings(): Promise<Settings>;
  saveSettings(patch: Partial<Settings>): Promise<Settings>;

  // Propuestas
  createProposal(input: CreateProposalInput): Promise<Proposal>;
  getProposal(token: string): Promise<Proposal | undefined>;
  updateProposal(
    token: string,
    patch: ProposalPatch,
  ): Promise<Proposal | undefined>;
  listProposals(jewelerId?: string): Promise<ProposalView[]>;
  viewProposal(token: string): Promise<ProposalView | undefined>;
  signalInterest(token: string, stoneId: string): Promise<Proposal | undefined>;

  // Órdenes (Opción A)
  confirmOrder(
    input: ConfirmOrderInput,
  ): Promise<{ proposal: Proposal; order: Order; hold: Hold } | undefined>;
  payOrder(input: PayOrderInput): Promise<Order | undefined>;
  advanceOrder(
    orderId: string,
    stage: OrderStage,
    note?: string,
  ): Promise<Order | undefined>;
  /** PAGO 2: saldo logístico confirmado y pagado al corte (nunca sin confirmar). */
  payLogistics(orderId: string, paymentRef: string): Promise<Order | undefined>;
  listOrders(jewelerId: string): Promise<Order[]>;
  getOrder(orderId: string): Promise<Order | undefined>;

  // Embarques (el barco semanal)
  listShipments(): Promise<Shipment[]>;
  getShipment(id: string): Promise<Shipment | undefined>;
  getOpenShipment(): Promise<Shipment | undefined>;
  createShipment(weekLabel: string, cutoffAt: string): Promise<Shipment>;
  /** Escalones de llenado del embarque (admin). */
  saveShipmentTiers(
    id: string,
    tiers: Shipment["tiers"],
  ): Promise<Shipment | undefined>;
  /**
   * CIERRE ATÓMICO: sólo entran (y definen el costo congelado) las piedras con
   * logística PAGADA; las candidatas sin Pago 2 rebotan al siguiente embarque
   * en este momento — nunca contaron en el costo de nadie.
   */
  closeShipment(
    id: string,
    frozen: { frozenLogiMxn: number; frozenAgenteMxn: number },
  ): Promise<Shipment | undefined>;
  advanceShipmentStatus(
    id: string,
    status: ShipmentStatus,
  ): Promise<Shipment | undefined>;

  // Direcciones
  listAddresses(jewelerId: string): Promise<ShippingAddress[]>;
  addAddress(
    jewelerId: string,
    data: Omit<ShippingAddress, "id" | "jewelerId" | "isDefault">,
  ): Promise<ShippingAddress>;
  updateAddress(
    id: string,
    patch: Partial<Omit<ShippingAddress, "id" | "jewelerId">>,
  ): Promise<ShippingAddress | undefined>;
  removeAddress(id: string): Promise<void>;
  setDefaultAddress(jewelerId: string, id: string): Promise<void>;

  // Métodos de pago (tokenizados / referencia — nunca datos crudos)
  listPaymentMethods(jewelerId: string): Promise<PaymentMethod[]>;
  addPaymentMethod(
    jewelerId: string,
    data: Omit<PaymentMethod, "id" | "jewelerId" | "isDefault">,
  ): Promise<PaymentMethod>;
  removePaymentMethod(id: string): Promise<void>;
  setDefaultPaymentMethod(jewelerId: string, id: string): Promise<void>;

  // Favoritos (snapshot)
  listFavorites(jewelerId: string): Promise<Favorite[]>;
  addFavorite(jewelerId: string, snapshot: Partial<Stone>): Promise<Favorite>;
  removeFavorite(jewelerId: string, stoneId: string): Promise<void>;
}

/**
 * Elige la implementación por entorno: si hay credenciales de Airtable, usa
 * Airtable; si no, memoria (demo local).
 */
export function getRepo(): Repo {
  const useAirtable = Boolean(
    process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID,
  );
  return useAirtable ? airtableRepo : memoryRepo;
}

/** Singleton de la capa de datos. */
export const repo: Repo = getRepo();
