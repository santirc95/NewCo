import type { OrderStage } from "./types";

/** Secuencia de trazabilidad del diamante (línea de vida). */
export const ORDER_STAGES: { stage: OrderStage; label: string }[] = [
  { stage: "orden_creada", label: "Orden creada" },
  { stage: "pago_confirmado", label: "Pago confirmado" },
  { stage: "confirmado_proveedor", label: "Confirmado con proveedor" },
  { stage: "en_transito", label: "En tránsito" },
  { stage: "en_aduana", label: "En aduana" },
  { stage: "nacionalizado", label: "Nacionalizado" },
  { stage: "entregado", label: "Entregado" },
];

export const STAGE_LABEL = Object.fromEntries(
  ORDER_STAGES.map((s) => [s.stage, s.label]),
) as Record<OrderStage, string>;

export const STAGE_SEQUENCE = ORDER_STAGES.map((s) => s.stage);
