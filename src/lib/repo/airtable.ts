import type { Repo } from "./index";

/**
 * Implementación de la capa de datos sobre AIRTABLE — esqueleto (v4).
 *
 * Se activa cuando `AIRTABLE_API_KEY` + `AIRTABLE_BASE_ID` están en el entorno
 * (getRepo lo decide). Acceso SOLO server-side. Envolver rate limits y mapear
 * las tablas del §2 del spec: Joyeros, Direcciones, MetodosPago, Favoritos,
 * Bandas, Config, Propuestas, Holds, Ordenes, Embarques.
 *
 * // TODO Cap.2: implementar con el SDK oficial (airtable) o fetch a la REST API.
 * // El inventario del proveedor NO va en Airtable.
 */

function todo(): never {
  throw new Error(
    "airtableRepo: no implementado todavía (Cap.2). Define AIRTABLE_* o usa la implementación en memoria.",
  );
}

export const airtableRepo: Repo = {
  getJeweler: todo,
  listJewelers: todo,
  createJeweler: todo,
  updateJewelerProfile: todo,
  setJewelerActive: todo,
  setJewelerApproved: todo,
  listBands: todo,
  saveBands: todo,
  getSettings: todo,
  saveSettings: todo,
  createProposal: todo,
  getProposal: todo,
  updateProposal: todo,
  listProposals: todo,
  viewProposal: todo,
  signalInterest: todo,
  confirmOrder: todo,
  payOrder: todo,
  advanceOrder: todo,
  confirmFinalCost: todo,
  listOrders: todo,
  getOrder: todo,
  listShipments: todo,
  getShipment: todo,
  getOpenShipment: todo,
  createShipment: todo,
  closeShipment: todo,
  advanceShipmentStatus: todo,
  listAddresses: todo,
  addAddress: todo,
  updateAddress: todo,
  removeAddress: todo,
  setDefaultAddress: todo,
  listPaymentMethods: todo,
  addPaymentMethod: todo,
  removePaymentMethod: todo,
  setDefaultPaymentMethod: todo,
  listFavorites: todo,
  addFavorite: todo,
  removeFavorite: todo,
};
