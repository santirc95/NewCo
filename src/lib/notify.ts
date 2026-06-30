/**
 * Notificación al joyero y confirmación con el proveedor — MOCK.
 * // TODO Cap.2: WhatsApp/email reales al joyero; API real del proveedor.
 */

export interface Notifier {
  jewelerSignaled(proposalId: string, stoneId: string, clientName: string): void;
}

export const notifier: Notifier = {
  jewelerSignaled(proposalId, stoneId, clientName) {
    console.log(
      `[notify→joyero] ${clientName} señaló ${stoneId} en ${proposalId}`,
    );
  },
};

export interface Supplier {
  confirmOrder(stoneId: string): { confirmed: boolean };
}

export const supplier: Supplier = {
  confirmOrder(stoneId) {
    // Solo se llama DESPUÉS de cobrar al joyero (ver payments + store.pay).
    console.log(`[proveedor] confirmar orden de ${stoneId}`);
    return { confirmed: true };
  },
};
