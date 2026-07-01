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

export interface RecordPaymentInput {
  token: string;
  stoneIds: string[];
  paymentRef: string;
  totalUsd: number;
  quoteSnapshot: Quote;
  stoneSnapshots: Partial<Stone>[];
}

/**
 * Capa de datos de NewCo. Toda la persistencia pasa por aquí para poder migrar
 * de memoria → Airtable sin reescribir la app. Métodos ASÍNCRONOS (Airtable lo
 * es). El inventario del proveedor NO vive aquí (viene de su API).
 */
export interface Repo {
  // Joyeros
  getJeweler(id: string): Promise<Jeweler | undefined>;
  listJewelers(): Promise<Jeweler[]>;
  updateJewelerProfile(
    id: string,
    patch: JewelerProfilePatch,
  ): Promise<Jeweler | undefined>;
  setJewelerActive(id: string, active: boolean): Promise<Jeweler | undefined>;

  // Bandas de margen
  listBands(): Promise<MarginBand[]>;
  saveBands(bands: MarginBand[]): Promise<MarginBand[]>;

  // Propuestas / holds
  createProposal(input: CreateProposalInput): Promise<Proposal>;
  getProposal(token: string): Promise<Proposal | undefined>;
  listProposals(jewelerId?: string): Promise<ProposalView[]>;
  viewProposal(token: string): Promise<ProposalView | undefined>;
  signalInterest(token: string, stoneId: string): Promise<Proposal | undefined>;
  triggerHold(
    token: string,
    stoneIds: string[],
  ): Promise<ProposalView | undefined>;

  // Pago + órdenes
  recordPaymentAndOrder(
    input: RecordPaymentInput,
  ): Promise<{ proposal: Proposal; order: Order } | undefined>;
  confirmOrderWithSupplier(orderId: string): Promise<Order | undefined>;
  advanceOrder(
    orderId: string,
    stage: OrderStage,
    note?: string,
  ): Promise<Order | undefined>;
  listOrders(jewelerId: string): Promise<Order[]>;
  getOrder(orderId: string): Promise<Order | undefined>;

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
