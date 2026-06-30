import type { ProposalPayload } from "./types";

/**
 * Token de propuesta — v1 SIN backend: la carga útil viaja codificada (base64url)
 * en el propio link `/p/[token]`. Esto evita estado de servidor y funciona en
 * Vercel/serverless para el demo.
 *
 * // TODO v2: token opaco e impredecible + registro en servidor (no exponer
 * // datos en el link, permitir caducidad/revocación y conteo de holds upstream).
 */

function bytesToBase64Url(json: string): string {
  // utf8-safe: encodeURIComponent -> ASCII -> base64 -> url-safe
  const b64 = btoa(encodeURIComponent(json));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToJson(token: string): string {
  const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "===".slice((b64.length + 3) % 4);
  return decodeURIComponent(atob(padded));
}

/** Codifica la propuesta en un token apto para URL (sólo cliente). */
export function encodeProposal(payload: ProposalPayload): string {
  return bytesToBase64Url(JSON.stringify(payload));
}

/** Decodifica el token; devuelve null si es inválido. */
export function decodeProposal(token: string): ProposalPayload | null {
  try {
    const payload = JSON.parse(base64UrlToJson(token)) as ProposalPayload;
    if (
      !payload ||
      typeof payload.clientName !== "string" ||
      !Array.isArray(payload.stoneIds) ||
      !payload.jeweler
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
