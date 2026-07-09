/**
 * Base pública para los links de propuesta al cliente final.
 *
 * El link va BRANDEADO con el joyero: nunca debe exponer la marca NewCo ni
 * mostrar localhost. Configura NEXT_PUBLIC_PROPOSAL_BASE_URL (p. ej.
 * https://propuestas.tudominio.com); sin ella cae al origin actual (dev).
 * // TODO Cap.2: dominio propio por joyero.
 */
export function proposalBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_PROPOSAL_BASE_URL;
  if (env) return env.replace(/\/$/, "");
  return typeof window !== "undefined" ? window.location.origin : "";
}

export function proposalUrl(token: string): string {
  return `${proposalBaseUrl()}/p/${token}`;
}
