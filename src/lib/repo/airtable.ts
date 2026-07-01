import type { Repo } from "./index";

/**
 * Implementación de la capa de datos sobre AIRTABLE — esqueleto.
 *
 * Se activa cuando `AIRTABLE_API_KEY` + `AIRTABLE_BASE_ID` están en el entorno
 * (getRepo lo decide). Acceso SOLO server-side. Envolver rate limits y mapear
 * cada tabla del §2 del spec.
 *
 * // TODO Cap.2: implementar con el SDK oficial (airtable) o fetch a la REST API.
 * // Tablas: Joyeros, Direcciones, MetodosPago, Favoritos, Bandas, Propuestas,
 * // Holds, Ordenes. El inventario del proveedor NO va en Airtable.
 */

function todo(): never {
  throw new Error(
    "airtableRepo: no implementado todavía (Cap.2). Define AIRTABLE_* o usa la implementación en memoria.",
  );
}

export const airtableRepo: Repo = {
  getJeweler: todo,
  listJewelers: todo,
  updateJewelerProfile: todo,
  setJewelerActive: todo,
  listBands: todo,
  saveBands: todo,
  createProposal: todo,
  getProposal: todo,
  listProposals: todo,
  viewProposal: todo,
  signalInterest: todo,
  triggerHold: todo,
  recordPaymentAndOrder: todo,
  confirmOrderWithSupplier: todo,
  advanceOrder: todo,
  listOrders: todo,
  getOrder: todo,
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
