/**
 * Cobro joyero → NewCo — MOCK.
 *
 * NewCo es el PRINCIPAL: esto es una venta (NewCo le vende el diamante al
 * joyero), NO transmisión de dinero de terceros. Sin escrow, sin Stripe Connect.
 *
 * // TODO Cap.2: cobro real a la cuenta de NewCo (SPEI / tarjeta).
 */

export interface PaymentConfirmation {
  ref: string;
  status: "confirmado";
}

export interface PaymentGateway {
  charge(amountMxn: number): Promise<PaymentConfirmation>;
}

export const payments: PaymentGateway = {
  async charge(amountMxn) {
    const id = crypto.randomUUID().slice(0, 8).toUpperCase();
    console.log(`[pago] joyero→NewCo $${Math.round(amountMxn)} MXN · ref SPEI-${id}`);
    return { ref: `SPEI-${id}`, status: "confirmado" };
  },
};
