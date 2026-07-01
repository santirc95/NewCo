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
} from "@/lib/types";
import { DEFAULT_BANDS } from "@/lib/quote";
import { getMockStone } from "@/lib/inventory";
import type {
  Repo,
  ProposalView,
  CreateProposalInput,
  RecordPaymentInput,
} from "./index";

/**
 * Implementación EN MEMORIA de la capa de datos (globalThis para sobrevivir HMR).
 * Suficiente para el demo local; no persiste en serverless multi-instancia.
 * // TODO Cap.2: la implementación real es `airtable.ts`.
 */

interface DB {
  jewelers: Map<string, Jeweler>;
  bands: MarginBand[];
  proposals: Map<string, Proposal>;
  holds: Hold[];
  orders: Order[];
  addresses: ShippingAddress[];
  payments: PaymentMethod[];
  favorites: Favorite[];
  folioSeq: number;
}

function seedJewelers(): Map<string, Jeweler> {
  const m = new Map<string, Jeweler>();
  m.set("jwl-vecchia", {
    id: "jwl-vecchia",
    role: "jeweler",
    name: "Vecchia Jewelry",
    rfc: "VJO950101AB1",
    razonSocial: "Vecchia Joyeros, S.A. de C.V.",
    regimenFiscal: "601 — General de Ley Personas Morales",
    cpFiscal: "11560",
    usoCfdi: "G03 — Gastos en general",
    domicilioFiscal: {
      calle: "Av. Presidente Masaryk",
      numExt: "123",
      colonia: "Polanco V Sección",
      municipio: "Miguel Hidalgo",
      estado: "Ciudad de México",
      cp: "11560",
    },
    active: true,
    createdAt: new Date().toISOString(),
  });
  return m;
}

// Llave versionada: al cambiar el modelo, re-siembra sin arrastrar datos viejos.
const g = globalThis as unknown as { __newcoDbV3?: DB };
const db: DB =
  g.__newcoDbV3 ??
  (g.__newcoDbV3 = {
    jewelers: seedJewelers(),
    bands: DEFAULT_BANDS.map((b) => ({ ...b })),
    proposals: new Map(),
    holds: [],
    orders: [],
    addresses: [],
    payments: [],
    favorites: [],
    folioSeq: 0,
  });

const uid = () => crypto.randomUUID();
const shortId = (p: string) => `${p}-${uid().slice(0, 8)}`;
const now = () => new Date().toISOString();

function activeHold(proposalId: string): Hold | null {
  return (
    [...db.holds]
      .reverse()
      .find((h) => h.proposalId === proposalId && h.status === "active") ?? null
  );
}
function orderOfProposal(proposalId: string): Order | null {
  return db.orders.find((o) => o.proposalId === proposalId) ?? null;
}
function nextFolio(): string {
  db.folioSeq += 1;
  const year = new Date().getFullYear();
  return `PG-${year}-${String(db.folioSeq).padStart(3, "0")}`;
}

export const memoryRepo: Repo = {
  /* ------------------------------- joyeros ------------------------------- */
  async getJeweler(id) {
    return db.jewelers.get(id);
  },
  async listJewelers() {
    return [...db.jewelers.values()].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
  },
  async updateJewelerProfile(id, patch: JewelerProfilePatch) {
    const j = db.jewelers.get(id);
    if (!j) return undefined;
    const { domicilioFiscal, ...rest } = patch;
    Object.assign(j, rest);
    if (domicilioFiscal)
      j.domicilioFiscal = { ...j.domicilioFiscal, ...domicilioFiscal };
    return j;
  },
  async setJewelerActive(id, active) {
    const j = db.jewelers.get(id);
    if (!j) return undefined;
    j.active = active;
    return j;
  },

  /* -------------------------------- bandas ------------------------------- */
  async listBands() {
    return db.bands.map((b) => ({ ...b }));
  },
  async saveBands(bands) {
    db.bands = bands
      .map((b) => ({ ...b }))
      .sort((a, b) => a.minValueUsd - b.minValueUsd);
    return db.bands.map((b) => ({ ...b }));
  },

  /* ------------------------------ propuestas ----------------------------- */
  async createProposal(input: CreateProposalInput) {
    const token = uid().replace(/-/g, "");
    const proposal: Proposal = {
      id: shortId("PRO"),
      token,
      jewelerId: input.jewelerId,
      clientName: input.clientName,
      stoneIds: input.stoneIds.slice(0, 4),
      jewelerWhatsapp: input.jewelerWhatsapp || undefined,
      createdAt: now(),
      status: "enviada",
    };
    db.proposals.set(token, proposal);
    return proposal;
  },
  async getProposal(token) {
    return db.proposals.get(token);
  },
  async listProposals(jewelerId) {
    return [...db.proposals.values()]
      .filter((p) => !jewelerId || p.jewelerId === jewelerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((p) => ({
        proposal: p,
        hold: activeHold(p.id),
        order: orderOfProposal(p.id),
      }));
  },
  async viewProposal(token) {
    const p = db.proposals.get(token);
    if (!p) return undefined;
    return { proposal: p, hold: activeHold(p.id), order: orderOfProposal(p.id) };
  },
  async signalInterest(token, stoneId) {
    const p = db.proposals.get(token);
    if (!p || !p.stoneIds.includes(stoneId)) return p;
    p.signaledStoneId = stoneId;
    if (p.status === "enviada") p.status = "señalada";
    return p;
  },
  async triggerHold(token, stoneIds) {
    const p = db.proposals.get(token);
    if (!p) return undefined;
    const windowMs = Math.min(
      ...stoneIds.map((id) => (getMockStone(id)?.holdWindowHours ?? 48)),
    ) *
      3600 *
      1000;
    const startedAt = Date.now();
    const hold: Hold = {
      id: shortId("HLD"),
      proposalId: p.id,
      stoneIds: [...stoneIds],
      startedAt,
      expiresAt: startedAt + windowMs,
      status: "active",
    };
    db.holds.push(hold);
    p.signaledStoneId = stoneIds[0] ?? p.signaledStoneId;
    p.status = "en_hold";
    return { proposal: p, hold, order: orderOfProposal(p.id) };
  },

  /* --------------------------- pago + órdenes ---------------------------- */
  async recordPaymentAndOrder(input: RecordPaymentInput) {
    const p = db.proposals.get(input.token);
    if (!p) return undefined;
    const order: Order = {
      id: shortId("ORD"),
      jewelerId: p.jewelerId,
      proposalId: p.id,
      stoneSnapshots: input.stoneSnapshots,
      quoteSnapshot: input.quoteSnapshot,
      totalUsd: input.totalUsd,
      jewelerPaymentRef: input.paymentRef,
      folio: nextFolio(),
      tracking: [
        { stage: "orden_creada", at: now() },
        { stage: "pago_confirmado", at: now() },
      ],
      createdAt: now(),
    };
    db.orders.push(order);
    const h = activeHold(p.id);
    if (h) h.status = "converted";
    p.status = "pagada";
    return { proposal: p, order };
  },
  async confirmOrderWithSupplier(orderId) {
    const o = db.orders.find((x) => x.id === orderId);
    if (!o) return undefined;
    o.tracking.push({ stage: "confirmado_proveedor", at: now() });
    const p = db.proposals.get(
      [...db.proposals.values()].find((x) => x.id === o.proposalId)?.token ?? "",
    );
    if (p) p.status = "ordenada";
    return o;
  },
  async advanceOrder(orderId, stage: OrderStage, note) {
    const o = db.orders.find((x) => x.id === orderId);
    if (!o) return undefined;
    o.tracking.push({ stage, at: now(), note });
    return o;
  },
  async listOrders(jewelerId) {
    return db.orders
      .filter((o) => o.jewelerId === jewelerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async getOrder(orderId) {
    return db.orders.find((o) => o.id === orderId);
  },

  /* ----------------------------- direcciones ----------------------------- */
  async listAddresses(jewelerId) {
    return db.addresses.filter((a) => a.jewelerId === jewelerId);
  },
  async addAddress(jewelerId, data) {
    const first = !db.addresses.some((a) => a.jewelerId === jewelerId);
    const addr: ShippingAddress = {
      id: shortId("ADR"),
      jewelerId,
      isDefault: first,
      ...data,
    };
    db.addresses.push(addr);
    return addr;
  },
  async updateAddress(id, patch) {
    const a = db.addresses.find((x) => x.id === id);
    if (!a) return undefined;
    Object.assign(a, patch);
    return a;
  },
  async removeAddress(id) {
    db.addresses = db.addresses.filter((a) => a.id !== id);
  },
  async setDefaultAddress(jewelerId, id) {
    db.addresses
      .filter((a) => a.jewelerId === jewelerId)
      .forEach((a) => (a.isDefault = a.id === id));
  },

  /* --------------------------- métodos de pago --------------------------- */
  async listPaymentMethods(jewelerId) {
    return db.payments.filter((p) => p.jewelerId === jewelerId);
  },
  async addPaymentMethod(jewelerId, data) {
    const first = !db.payments.some((p) => p.jewelerId === jewelerId);
    const pm: PaymentMethod = {
      id: shortId("PM"),
      jewelerId,
      isDefault: first,
      ...data,
    };
    db.payments.push(pm);
    return pm;
  },
  async removePaymentMethod(id) {
    db.payments = db.payments.filter((p) => p.id !== id);
  },
  async setDefaultPaymentMethod(jewelerId, id) {
    db.payments
      .filter((p) => p.jewelerId === jewelerId)
      .forEach((p) => (p.isDefault = p.id === id));
  },

  /* ------------------------------ favoritos ------------------------------ */
  async listFavorites(jewelerId) {
    return db.favorites
      .filter((f) => f.jewelerId === jewelerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async addFavorite(jewelerId, snapshot) {
    const stoneId = snapshot.id ?? "";
    const existing = db.favorites.find(
      (f) => f.jewelerId === jewelerId && f.stoneId === stoneId,
    );
    if (existing) return existing;
    const fav: Favorite = {
      id: shortId("FAV"),
      jewelerId,
      stoneId,
      certNumber: snapshot.certNumber ?? "",
      snapshot,
      createdAt: now(),
    };
    db.favorites.push(fav);
    return fav;
  },
  async removeFavorite(jewelerId, stoneId) {
    db.favorites = db.favorites.filter(
      (f) => !(f.jewelerId === jewelerId && f.stoneId === stoneId),
    );
  },
};
