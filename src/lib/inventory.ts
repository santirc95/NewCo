import type { Stone } from "./types";

/**
 * Inventario del proveedor — MOCK.
 *
 * Costura de integración: en v2 esto se reemplaza por la API real del proveedor.
 * Mantener el acceso detrás de `SupplierInventory` para que conectar la API sea
 * cambiar la implementación, no la app.
 *
 * // TODO v2: conectar API real del proveedor (auth, paginación, foto/video).
 */

/** URL de verificación del certificado según la certificadora. */
function certUrl(lab: Stone["lab"], certNumber: string): string {
  const no = certNumber.replace(/[^0-9]/g, "");
  return lab === "GIA"
    ? `https://www.gia.edu/report-check?reportno=${no}`
    : `https://www.igi.org/verify-your-report/?r=${no}`;
}

type StoneSeed = Omit<Stone, "certUrl">;

const SEED: StoneSeed[] = [
  { id: "D-1042", certNumber: "GIA 2456789012", shape: "Redondo", carat: 1.01, color: "D", clarity: "VVS1", cut: "EX", polish: "Excelente", symmetry: "Excelente", fluorescence: "Ninguna", measurements: "6.45 × 6.48 × 3.99 mm", depthPct: 61.7, tablePct: 57, lab: "GIA", type: "natural", origin: "Natural · India", supplierPriceUsd: 8600, holdWindowHours: 48 },
  { id: "D-1067", certNumber: "GIA 2287654301", shape: "Óvalo", carat: 1.2, color: "E", clarity: "VS1", cut: "EX", polish: "Excelente", symmetry: "Muy buena", fluorescence: "Tenue", measurements: "8.10 × 5.90 × 3.65 mm", depthPct: 61.9, tablePct: 58, lab: "GIA", type: "natural", origin: "Natural · Botswana", supplierPriceUsd: 7800, holdWindowHours: 48 },
  { id: "D-1089", certNumber: "GIA 6195512744", shape: "Cojín", carat: 1.51, color: "F", clarity: "VS2", cut: "VG", polish: "Muy buena", symmetry: "Muy buena", fluorescence: "Ninguna", measurements: "6.80 × 6.70 × 4.40 mm", depthPct: 65.7, tablePct: 60, lab: "GIA", type: "natural", origin: "Natural · India", supplierPriceUsd: 10500, holdWindowHours: 48 },
  { id: "L-2031", certNumber: "IGI 612398745", shape: "Redondo", carat: 1.5, color: "D", clarity: "VVS2", cut: "EX", polish: "Excelente", symmetry: "Excelente", fluorescence: "Ninguna", measurements: "7.36 × 7.39 × 4.55 mm", depthPct: 61.6, tablePct: 56, lab: "IGI", type: "lab", origin: "Cultivado en laboratorio (CVD)", supplierPriceUsd: 2400, holdWindowHours: 72 },
  { id: "D-1110", certNumber: "GIA 1339920154", shape: "Esmeralda", carat: 1.05, color: "F", clarity: "VVS2", cut: "VG", polish: "Excelente", symmetry: "Muy buena", fluorescence: "Ninguna", measurements: "6.50 × 4.80 × 3.20 mm", depthPct: 66.6, tablePct: 62, lab: "GIA", type: "natural", origin: "Natural · India", supplierPriceUsd: 7200, holdWindowHours: 48 },
  { id: "D-1124", certNumber: "GIA 7401128855", shape: "Pera", carat: 0.91, color: "E", clarity: "VS1", cut: "EX", polish: "Excelente", symmetry: "Excelente", fluorescence: "Tenue", measurements: "8.20 × 5.40 × 3.30 mm", depthPct: 61.1, tablePct: 57, lab: "GIA", type: "natural", origin: "Natural · Sudáfrica", supplierPriceUsd: 5400, holdWindowHours: 48 },
  { id: "L-2055", certNumber: "IGI 644120097", shape: "Óvalo", carat: 2.01, color: "E", clarity: "VS1", cut: "EX", polish: "Excelente", symmetry: "Excelente", fluorescence: "Ninguna", measurements: "9.60 × 6.95 × 4.30 mm", depthPct: 61.9, tablePct: 58, lab: "IGI", type: "lab", origin: "Cultivado en laboratorio (HPHT)", supplierPriceUsd: 3800, holdWindowHours: 72 },
  { id: "D-1138", certNumber: "GIA 2255019384", shape: "Princesa", carat: 1.0, color: "G", clarity: "SI1", cut: "VG", polish: "Muy buena", symmetry: "Muy buena", fluorescence: "Media", measurements: "5.50 × 5.45 × 3.95 mm", depthPct: 72.5, tablePct: 68, lab: "GIA", type: "natural", origin: "Natural · India", supplierPriceUsd: 4300, holdWindowHours: 48 },
  { id: "D-1150", certNumber: "GIA 5176650028", shape: "Redondo", carat: 2.05, color: "F", clarity: "VS2", cut: "EX", polish: "Excelente", symmetry: "Excelente", fluorescence: "Ninguna", measurements: "8.15 × 8.19 × 5.05 mm", depthPct: 61.8, tablePct: 57, lab: "GIA", type: "natural", origin: "Natural · Botswana", supplierPriceUsd: 18500, holdWindowHours: 48 },
  { id: "L-2068", certNumber: "IGI 658873112", shape: "Cojín", carat: 1.8, color: "D", clarity: "VVS1", cut: "EX", polish: "Excelente", symmetry: "Muy buena", fluorescence: "Ninguna", measurements: "7.20 × 7.05 × 4.60 mm", depthPct: 65.2, tablePct: 59, lab: "IGI", type: "lab", origin: "Cultivado en laboratorio (CVD)", supplierPriceUsd: 3200, holdWindowHours: 72 },
  { id: "D-1163", certNumber: "GIA 3390028471", shape: "Marquesa", carat: 1.12, color: "G", clarity: "VS1", cut: "VG", polish: "Muy buena", symmetry: "Buena", fluorescence: "Tenue", measurements: "10.10 × 5.05 × 3.10 mm", depthPct: 61.4, tablePct: 56, lab: "GIA", type: "natural", origin: "Natural · India", supplierPriceUsd: 5600, holdWindowHours: 48 },
  { id: "D-1177", certNumber: "GIA 6624471900", shape: "Óvalo", carat: 1.35, color: "D", clarity: "VVS2", cut: "EX", polish: "Excelente", symmetry: "Excelente", fluorescence: "Ninguna", measurements: "8.55 × 6.20 × 3.80 mm", depthPct: 61.3, tablePct: 57, lab: "GIA", type: "natural", origin: "Natural · Sudáfrica", supplierPriceUsd: 11500, holdWindowHours: 48 },
];

const MOCK_STONES: Stone[] = SEED.map((s) => ({
  ...s,
  certUrl: certUrl(s.lab, s.certNumber),
}));

/** Interfaz de acceso al inventario del proveedor. */
export interface SupplierInventory {
  list(): Promise<Stone[]>;
  get(id: string): Promise<Stone | undefined>;
}

/** Implementación MOCK (sincrónica por dentro, async por contrato). */
export const supplierInventory: SupplierInventory = {
  async list() {
    return MOCK_STONES;
  },
  async get(id) {
    return MOCK_STONES.find((s) => s.id === id);
  },
};

/** Acceso directo a los datos mock (para componentes cliente sin await). */
export function getMockStones(): Stone[] {
  return MOCK_STONES;
}

export function getMockStone(id: string): Stone | undefined {
  return MOCK_STONES.find((s) => s.id === id);
}

/** Catálogos para construir los filtros. */
export const SHAPES: Stone["shape"][] = [
  "Redondo",
  "Óvalo",
  "Cojín",
  "Esmeralda",
  "Pera",
  "Princesa",
  "Marquesa",
];
export const COLORS = ["D", "E", "F", "G", "H"];
export const CLARITIES = ["FL/IF", "VVS1", "VVS2", "VS1", "VS2", "SI1"];
export const CUTS: { value: Stone["cut"]; label: string }[] = [
  { value: "EX", label: "Excelente" },
  { value: "VG", label: "Muy buena" },
  { value: "G", label: "Buena" },
];
export const LABS: Stone["lab"][] = ["GIA", "IGI"];
