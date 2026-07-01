import { auth } from "@/auth";

/**
 * Protección de rutas validada en el servidor (edge).
 * - Públicas: /login, /p/[token], /api/auth/*.
 * - Resto: requiere sesión.
 * - /admin: sólo role 'admin'.
 */
export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const isLoggedIn = Boolean(req.auth);
  const role = req.auth?.user?.role;

  const isPublic =
    path.startsWith("/login") ||
    path.startsWith("/p/") ||
    path.startsWith("/api/auth");

  if (isPublic) return;

  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  // El joyero nunca entra al portal admin.
  if (path.startsWith("/admin") && role !== "admin") {
    return Response.redirect(new URL("/inventario", nextUrl));
  }

  return;
});

export const config = {
  // Excluye estáticos; corre en todo lo demás.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
