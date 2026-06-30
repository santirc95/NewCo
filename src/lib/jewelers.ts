import type { Jeweler } from "./types";

/**
 * Joyeros — MOCK. En v1 basta un selector; en v2 vendrá de auth + Airtable.
 * // TODO v2: autenticación real del joyero y persistencia de su marca.
 */
export const JEWELERS: Jeweler[] = [
  {
    id: "vecchia",
    name: "Vecchia Jewelry",
    branding: {
      logoText: "V",
      name: "Vecchia Jewelry",
      tagline: "Alta joyería · desde 1987",
      address: "Av. Presidente Masaryk · Polanco, CDMX",
      advisorName: "Lucía Vecchia",
    },
  },
  {
    id: "aurea",
    name: "Áurea Atelier",
    branding: {
      logoText: "A",
      name: "Áurea Atelier",
      tagline: "Joyería de autor",
      address: "Av. Vallarta · Guadalajara, JAL",
      advisorName: "Mariana Áurea",
    },
  },
  {
    id: "lumen",
    name: "Lumen Diamantes",
    branding: {
      logoText: "L",
      name: "Lumen Diamantes",
      tagline: "Diamantes certificados",
      address: "Calzada del Valle · San Pedro, NL",
      advisorName: "Diego Lumen",
    },
  },
];

export function getJeweler(id: string): Jeweler | undefined {
  return JEWELERS.find((j) => j.id === id);
}
