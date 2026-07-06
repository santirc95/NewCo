import type { ImportMethod, OrderStage } from "./types";

/** Secuencia completa de trazabilidad del diamante (línea de vida, v4). */
export const ORDER_STAGES: { stage: OrderStage; label: string }[] = [
  { stage: "confirmada", label: "Orden confirmada" },
  { stage: "pago_confirmado", label: "Pago confirmado" },
  { stage: "comprada_proveedor", label: "Comprada al proveedor" },
  { stage: "en_embarque", label: "En embarque" },
  { stage: "en_transito", label: "En tránsito" },
  { stage: "en_aduana", label: "En aduana" },
  { stage: "nacionalizado", label: "Nacionalizado" },
  { stage: "entregado", label: "Entregado" },
];

export const STAGE_LABEL = Object.fromEntries(
  ORDER_STAGES.map((s) => [s.stage, s.label]),
) as Record<OrderStage, string>;

/**
 * Secuencia aplicable según el método: la importación DIRECTA no pasa por
 * "En embarque"; la consolidada sí.
 */
export function stagesForMethod(
  method?: ImportMethod,
): { stage: OrderStage; label: string }[] {
  return method === "consolidada"
    ? ORDER_STAGES
    : ORDER_STAGES.filter((s) => s.stage !== "en_embarque");
}
