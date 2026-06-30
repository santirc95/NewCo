import type { Proposal, Hold, Order, Jeweler, MarginBand } from "./types";
import { getMockStone } from "./inventory";
import { DEFAULT_BANDS } from "./quote";

/**
 * Store de propuestas — Etapa 1: EN MEMORIA (un solo proceso).
 *
 * Persistido en globalThis para sobrevivir el HMR de dev. Suficiente para el
 * demo local (npm run dev / start). No sobrevive multi-instancia/serverless.
 *
 * // TODO Cap.2: reemplazar por Airtable/DB persistente detrás de esta misma API.
 */

interface DB {
  proposals: Map<string, Proposal>;
  holds: Hold[];
  orders: Order[];
  jewelers: Map<string, Jeweler>;
  bands: MarginBand[];
}

function seedJewelers(): Map<string, Jeweler> {
  const m = new Map<string, Jeweler>();
  m.set("jwl-vecchia", {
    id: "jwl-vecchia",
    name: "Vecchia Jewelry",
    legalName: "Vecchia Joyeros, S.A. de C.V.",
    rfc: "VJO950101AB1",
    address: "Av. Presidente Masaryk, Polanco, CDMX",
    contactEmail: "contacto@vecchia.mx",
    contactPhone: "5512345678",
    active: true,
    createdAt: new Date().toISOString(),
  });
  return m;
}

const g = globalThis as unknown as { __newcoDb?: DB };
const db: DB =
  g.__newcoDb ??
  (g.__newcoDb = {
    proposals: new Map(),
    holds: [],
    orders: [],
    jewelers: seedJewelers(),
    bands: DEFAULT_BANDS.map((b) => ({ ...b })),
  });

const uid = () => crypto.randomUUID();
const shortId = (prefix: string) => `${prefix}-${uid().slice(0, 8)}`;

/** Vista enriquecida de una propuesta para el seguimiento del joyero. */
export interface ProposalView {
  proposal: Proposal;
  hold: Hold | null;
  order: Order | null;
}

function activeHold(proposalId: string): Hold | null {
  return (
    [...db.holds]
      .reverse()
      .find((h) => h.proposalId === proposalId && h.status === "active") ?? null
  );
}

function orderOf(proposalId: string): Order | null {
  return db.orders.find((o) => o.proposalId === proposalId) ?? null;
}

export const proposalStore = {
  /** El joyero arma la propuesta (1–4 piedras) y captura el nombre del cliente. */
  create(clientName: string, stoneIds: string[], jewelerWhatsapp?: string): Proposal {
    const token = uid().replace(/-/g, "");
    const proposal: Proposal = {
      id: shortId("PRO"),
      token,
      clientName,
      stoneIds: stoneIds.slice(0, 4),
      jewelerWhatsapp: jewelerWhatsapp || undefined,
      createdAt: new Date().toISOString(),
      status: "enviada",
    };
    db.proposals.set(token, proposal);
    return proposal;
  },

  get(token: string): Proposal | undefined {
    return db.proposals.get(token);
  },

  /** Vistas enriquecidas, más recientes primero. */
  list(): ProposalView[] {
    return [...db.proposals.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((p) => ({
        proposal: p,
        hold: activeHold(p.id),
        order: orderOf(p.id),
      }));
  },

  view(token: string): ProposalView | undefined {
    const p = db.proposals.get(token);
    if (!p) return undefined;
    return { proposal: p, hold: activeHold(p.id), order: orderOf(p.id) };
  },

  /** El cliente final señala interés (no es compra). */
  signal(token: string, stoneId: string): Proposal | undefined {
    const p = db.proposals.get(token);
    if (!p || !p.stoneIds.includes(stoneId)) return p;
    p.signaledStoneId = stoneId;
    if (p.status === "enviada") p.status = "señalada";
    return p;
  },

  /** El JOYERO dispara el hold. Ventana ≤ la del proveedor. */
  hold(token: string, stoneId: string): { proposal: Proposal; hold: Hold } | undefined {
    const p = db.proposals.get(token);
    if (!p) return undefined;
    const stone = getMockStone(stoneId);
    const startedAt = Date.now();
    const windowMs = (stone?.holdWindowHours ?? 48) * 3600 * 1000;
    const hold: Hold = {
      id: shortId("HLD"),
      proposalId: p.id,
      stoneId,
      startedAt,
      expiresAt: startedAt + windowMs,
      status: "active",
    };
    db.holds.push(hold);
    p.signaledStoneId = stoneId;
    p.status = "en_hold";
    return { proposal: p, hold };
  },

  /**
   * Registra el pago del joyero y crea la Order. NO confirma con el proveedor:
   * eso lo hace el caller (acción) DESPUÉS, respetando la secuencia obligatoria.
   */
  recordPayment(
    token: string,
    stoneId: string,
    paymentRef: string,
  ): { proposal: Proposal; order: Order } | undefined {
    const p = db.proposals.get(token);
    if (!p) return undefined;
    const order: Order = {
      id: shortId("ORD"),
      proposalId: p.id,
      stoneId,
      jewelerPaymentRef: paymentRef,
      createdAt: new Date().toISOString(),
    };
    db.orders.push(order);
    const h = activeHold(p.id);
    if (h) h.status = "converted";
    p.status = "pagada";
    return { proposal: p, order };
  },

  /** Marca la orden como confirmada con el proveedor (tras el pago). */
  markOrdered(token: string): Proposal | undefined {
    const p = db.proposals.get(token);
    if (!p) return undefined;
    p.status = "ordenada";
    return p;
  },

  /* ----------------------------- joyeros -------------------------------- */

  listJewelers(): Jeweler[] {
    return [...db.jewelers.values()].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
  },

  getJeweler(id: string): Jeweler | undefined {
    return db.jewelers.get(id);
  },

  /** El joyero edita SOLO sus campos de perfil (no `active`/`id`/`createdAt`). */
  updateJewelerProfile(
    id: string,
    patch: Partial<
      Pick<
        Jeweler,
        | "name"
        | "legalName"
        | "rfc"
        | "address"
        | "contactEmail"
        | "contactPhone"
      >
    >,
  ): Jeweler | undefined {
    const j = db.jewelers.get(id);
    if (!j) return undefined;
    Object.assign(j, patch);
    return j;
  },

  /** Administrado por NewCo. */
  setJewelerActive(id: string, active: boolean): Jeweler | undefined {
    const j = db.jewelers.get(id);
    if (!j) return undefined;
    j.active = active;
    return j;
  },

  /* ----------------------------- bandas --------------------------------- */

  listBands(): MarginBand[] {
    return db.bands.map((b) => ({ ...b }));
  },

  /** Reemplaza la tabla de bandas (admin). */
  saveBands(bands: MarginBand[]): MarginBand[] {
    db.bands = bands
      .map((b) => ({ ...b }))
      .sort((a, b) => a.minValueUsd - b.minValueUsd);
    return this.listBands();
  },
};
