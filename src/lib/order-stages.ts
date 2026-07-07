import type { ImportMethod, OrderStage } from "./types";

/**
 * Trazabilidad del diamante (v4.1 — dos pagos por adelantado).
 * "pendiente_logistica" es un estado EXCEPCIONAL (3 rebotes): no forma parte
 * del camino feliz; se muestra como alerta, no como paso del timeline.
 */
export const ORDER_STAGES: { stage: OrderStage; label: string }[] = [
  { stage: "confirmada", label: "Orden confirmada" },
  { stage: "pago_piedra", label: "Piedra pagada · Pago 1" },
  { stage: "comprada_proveedor", label: "Comprada al proveedor" },
  { stage: "en_embarque", label: "En embarque" },
  { stage: "pago_logistica", label: "Logística pagada · Pago 2" },
  { stage: "en_transito", label: "En tránsito" },
  { stage: "en_aduana", label: "En aduana" },
  { stage: "nacionalizado", label: "Nacionalizado" },
  { stage: "entregado", label: "Entregado" },
];

export const STAGE_LABEL: Record<OrderStage, string> = {
  ...(Object.fromEntries(ORDER_STAGES.map((s) => [s.stage, s.label])) as Record<
    OrderStage,
    string
  >),
  pendiente_logistica: "Pendiente de logística",
};

/**
 * Camino feliz según el método. La importación DIRECTA no pasa por
 * "En embarque" (paga piedra + logística en un solo momento, por adelantado).
 */
export function stagesForMethod(
  method?: ImportMethod,
): { stage: OrderStage; label: string }[] {
  return method === "consolidada"
    ? ORDER_STAGES
    : ORDER_STAGES.filter((s) => s.stage !== "en_embarque");
}
