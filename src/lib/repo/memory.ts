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
  Shipment,
  ShipmentStatus,
  Settings,
} from "@/lib/types";
import { DEFAULT_BANDS } from "@/lib/quote";
import { DEFAULT_TIERS } from "@/lib/tiers";
import { getMockStone } from "@/lib/inventory";
import type {
  Repo,
  ProposalView,
  CreateProposalInput,
  ProposalPatch,
  ConfirmOrderInput,
  PayOrderInput,
} from "./index";

/**
 * Implementación EN MEMORIA de la capa de datos v4 (globalThis para sobrevivir
 * HMR). Suficiente para el demo local; no persiste en serverless multi-instancia.
 * // TODO Cap.2: la implementación real es `airtable.ts`.
 */

interface DB {
  jewelers: Map<string, Jeweler>;
  bands: MarginBand[];
  settings: Settings;
  proposals: Map<string, Proposal>;
  holds: Hold[];
  orders: Order[];
  shipments: Shipment[];
  addresses: ShippingAddress[];
  payments: PaymentMethod[];
  favorites: Favorite[];
  folioSeq: number;
}

const uid = () => crypto.randomUUID();
const shortId = (p: string) => `${p}-${uid().slice(0, 8)}`;
const now = () => new Date().toISOString();

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
    approved: true,
    createdAt: now(),
  });
  return m;
}

/** Próximo corte según el día configurado (default jueves 18:00). */
function nextCutoff(dayOfWeek: number): string {
  const d = new Date();
  const diff = (dayOfWeek - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  d.setHours(18, 0, 0, 0);
  return d.toISOString();
}

function seedShipments(settings: Settings): Shipment[] {
  const cutoffAt = nextCutoff(settings.cutoffDayOfWeek);
  const label = new Date(cutoffAt).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
  });
  return [
    {
      id: shortId("EMB"),
      weekLabel: `Embarque · corte ${label}`,
      cutoffAt,
      status: "abierto",
      orderIds: [],
      paidLogisticsOrderIds: [],
      tiers: DEFAULT_TIERS.map((t) => ({ ...t })),
    },
  ];
}

const SEED_SETTINGS: Settings = {
  shipmentDayLabel: "Pedidos de importación: cada jueves",
  transitWeeks: "Importación de 2 a 3 semanas",
  cutoffDayOfWeek: 4,
};

const g = globalThis as unknown as { __newcoDbV42?: DB };
const db: DB =
  g.__newcoDbV42 ??
  (g.__newcoDbV42 = (() => {
    const settings = { ...SEED_SETTINGS };
    return {
      jewelers: seedJewelers(),
      bands: DEFAULT_BANDS.map((b) => ({ ...b })),
      settings,
      proposals: new Map(),
      holds: [],
      orders: [],
      shipments: seedShipments(settings),
      addresses: [],
      payments: [],
      favorites: [],
      folioSeq: 0,
    };
  })());

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
function proposalOfOrder(order: Order): Proposal | undefined {
  return [...db.proposals.values()].find((p) => p.id === order.proposalId);
}
function nextFolio(): string {
  db.folioSeq += 1;
  const year = new Date().getFullYear();
  return `PG-${year}-${String(db.folioSeq).padStart(3, "0")}`;
}

/** Rebota una piedra sin Pago 2 al siguiente embarque (límite 3). */
function bounceOrder(o: Order, from: Shipment): void {
  o.reboteCount = (o.reboteCount ?? 0) + 1;
  if (o.reboteCount >= 3) {
    // Evita rebote infinito: pasa a gestión del admin.
    o.shipmentId = undefined;
    o.tracking.push({
      stage: "pendiente_logistica",
      at: now(),
      note: "3 embarques sin cubrir la logística — gestionar con NewCo",
    });
    return;
  }
  // Busca (o abre) el siguiente embarque de la semana próxima.
  let next = db.shipments.find(
    (x) => x.id !== from.id && x.status === "abierto",
  );
  if (!next) {
    const cutoff = new Date(new Date(from.cutoffAt).getTime() + 7 * 86400000);
    const label = cutoff.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
    });
    next = {
      id: shortId("EMB"),
      weekLabel: `Embarque · corte ${label}`,
      cutoffAt: cutoff.toISOString(),
      status: "abierto",
      orderIds: [],
      paidLogisticsOrderIds: [],
      tiers: from.tiers.map((t) => ({ ...t })),
    };
    db.shipments.push(next);
  }
  next.orderIds.push(o.id);
  o.shipmentId = next.id;
  o.tracking.push({
    stage: "en_embarque",
    at: now(),
    note: `Rebotó al ${next.weekLabel} — su costo logístico se ajustará según ese embarque`,
  });
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
  async createJeweler(data) {
    const j: Jeweler = { ...data, id: shortId("JWL"), createdAt: now() };
    db.jewelers.set(j.id, j);
    return j;
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
  async setJewelerApproved(id, approved) {
    const j = db.jewelers.get(id);
    if (!j) return undefined;
    j.approved = approved;
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

  /* -------------------------------- config ------------------------------- */
  async getSettings() {
    return { ...db.settings };
  },
  async saveSettings(patch) {
    Object.assign(db.settings, patch);
    return { ...db.settings };
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
  async updateProposal(token, patch: ProposalPatch) {
    const p = db.proposals.get(token);
    if (!p) return undefined;
    if (patch.clientName !== undefined) p.clientName = patch.clientName;
    if (patch.stoneIds) {
      p.stoneIds = patch.stoneIds.slice(0, 4);
      // Si la piedra señalada salió del set, se limpia la señal.
      if (p.signaledStoneId && !p.stoneIds.includes(p.signaledStoneId)) {
        p.signaledStoneId = undefined;
        if (p.status === "señalada") p.status = "enviada";
      }
    }
    if (
      patch.signaledStoneId !== undefined &&
      p.stoneIds.includes(patch.signaledStoneId)
    ) {
      p.signaledStoneId = patch.signaledStoneId;
      if (p.status === "enviada") p.status = "señalada";
    }
    return p;
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
    // El cliente puede cambiar su selección DENTRO del mismo set mientras la
    // orden no esté confirmada.
    if (p.status === "enviada" || p.status === "señalada") {
      p.signaledStoneId = stoneId;
      p.status = "señalada";
    }
    return p;
  },

  /* --------------------------- órdenes (Opción A) ------------------------ */
  async confirmOrder(input: ConfirmOrderInput) {
    const p = db.proposals.get(input.token);
    if (!p) return undefined;
    const stone = getMockStone(input.stoneId);
    const startedAt = Date.now();
    const windowMs = (stone?.holdWindowHours ?? 48) * 3600 * 1000;
    const hold: Hold = {
      id: shortId("HLD"),
      proposalId: p.id,
      stoneIds: [input.stoneId],
      startedAt,
      expiresAt: startedAt + windowMs,
      status: "active",
    };
    db.holds.push(hold);
    const order: Order = {
      id: shortId("ORD"),
      jewelerId: p.jewelerId,
      proposalId: p.id,
      stoneSnapshot: input.stoneSnapshot,
      quoteSnapshot: input.quoteSnapshot,
      totalUsd: input.totalUsd,
      holdId: hold.id,
      tracking: [{ stage: "confirmada", at: now() }],
      createdAt: now(),
    };
    db.orders.push(order);
    p.signaledStoneId = input.stoneId;
    p.status = "confirmada";
    return { proposal: p, order, hold };
  },

  async payOrder(input: PayOrderInput) {
    const o = db.orders.find((x) => x.id === input.orderId);
    if (!o) return undefined;
    if (input.quoteSnapshot) o.quoteSnapshot = input.quoteSnapshot;
    o.importMethod = input.method;
    o.jewelerPaymentRef = input.paymentRef;
    o.folio = o.folio ?? nextFolio();
    // Regla de oro: el pago ANTECEDE a la compra al proveedor.
    o.tracking.push({
      stage: "pago_piedra",
      at: now(),
      note: `Pago 1 · ${input.paymentRef}`,
    });
    o.tracking.push({ stage: "comprada_proveedor", at: now() });
    // La piedra ya es de NewCo → se suelta el hold (deja de correr el reloj).
    // Queda resguardada con el proveedor hasta que su embarque esté pagado.
    const h = db.holds.find((x) => x.id === o.holdId);
    if (h) h.status = "converted";
    const p = proposalOfOrder(o);
    if (input.method === "consolidada") {
      const s =
        db.shipments.find((x) => x.id === input.shipmentId) ??
        db.shipments.find((x) => x.status === "abierto");
      if (s && !s.orderIds.includes(o.id)) {
        s.orderIds.push(o.id);
        o.shipmentId = s.id;
      }
      o.tracking.push({ stage: "en_embarque", at: now(), note: s?.weekLabel });
      if (p) p.status = "en_embarque";
    } else {
      // Directa: piedra + logística en el mismo momento (ambos por adelantado).
      o.tracking.push({
        stage: "pago_logistica",
        at: now(),
        note: `Pago 2 · ${input.paymentRef}`,
      });
      o.finalCostConfirmed = true;
      if (p) p.status = "importando";
    }
    return o;
  },

  async payLogistics(orderId, paymentRef) {
    const o = db.orders.find((x) => x.id === orderId);
    if (!o) return undefined;
    o.tracking.push({
      stage: "pago_logistica",
      at: now(),
      note: `Pago 2 · ${paymentRef}`,
    });
    o.finalCostConfirmed = true;
    // Cierre atómico: queda registrada entre las que SÍ entran al corte.
    const s = db.shipments.find((x) => x.id === o.shipmentId);
    if (s && !s.paidLogisticsOrderIds.includes(o.id)) {
      s.paidLogisticsOrderIds.push(o.id);
    }
    return o;
  },

  async advanceOrder(orderId, stage: OrderStage, note) {
    const o = db.orders.find((x) => x.id === orderId);
    if (!o) return undefined;
    o.tracking.push({ stage, at: now(), note });
    const p = proposalOfOrder(o);
    if (p) {
      if (stage === "entregado") p.status = "entregada";
      else if (stage === "en_transito") p.status = "importando";
    }
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

  /* ------------------------------- embarques ----------------------------- */
  async listShipments() {
    return [...db.shipments].sort((a, b) =>
      b.cutoffAt.localeCompare(a.cutoffAt),
    );
  },
  async getShipment(id) {
    return db.shipments.find((s) => s.id === id);
  },
  async getOpenShipment() {
    return [...db.shipments]
      .filter((s) => s.status === "abierto")
      .sort((a, b) => a.cutoffAt.localeCompare(b.cutoffAt))[0];
  },
  async createShipment(weekLabel, cutoffAt) {
    const s: Shipment = {
      id: shortId("EMB"),
      weekLabel,
      cutoffAt,
      status: "abierto",
      orderIds: [],
      paidLogisticsOrderIds: [],
      tiers: DEFAULT_TIERS.map((t) => ({ ...t })),
    };
    db.shipments.push(s);
    return s;
  },
  async saveShipmentTiers(id, tiers) {
    const s = db.shipments.find((x) => x.id === id);
    if (!s) return undefined;
    s.tiers = tiers
      .map((t) => ({ ...t }))
      .sort((a, b) => a.minStones - b.minStones);
    return s;
  },
  async closeShipment(id, frozen) {
    const s = db.shipments.find((x) => x.id === id);
    if (!s) return undefined;
    // CIERRE ATÓMICO: sólo entran (y definen el costo) las piedras con
    // logística PAGADA; las candidatas sin Pago 2 rebotan AHORA — nunca
    // llegaron a contar en el costo de nadie.
    const paid = new Set(s.paidLogisticsOrderIds);
    for (const orderId of [...s.orderIds]) {
      if (paid.has(orderId)) continue;
      const o = db.orders.find((x) => x.id === orderId);
      if (o) bounceOrder(o, s);
    }
    s.orderIds = s.orderIds.filter((x) => paid.has(x));
    s.status = "cerrado";
    s.frozenLogiMxn = frozen.frozenLogiMxn;
    s.frozenAgenteMxn = frozen.frozenAgenteMxn;
    return s;
  },
  async advanceShipmentStatus(id, status: ShipmentStatus) {
    const s = db.shipments.find((x) => x.id === id);
    if (!s) return undefined;
    s.status = status;
    if (status === "en_transito") {
      // Tras el cierre atómico, todo lo que queda a bordo tiene Pago 2.
      for (const orderId of s.orderIds) {
        await this.advanceOrder(orderId, "en_transito", s.weekLabel);
      }
    }
    return s;
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
