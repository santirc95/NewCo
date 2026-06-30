import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyUser } from "@/lib/users";

/**
 * Configuración de autenticación (NextAuth v5).
 * Roles `jeweler` / `admin` en el JWT; permisos validados en server (middleware
 * + checks en server actions/páginas).
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const u = verifyUser(
          String(creds?.email ?? ""),
          String(creds?.password ?? ""),
        );
        if (!u) return null;
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          jewelerId: u.jewelerId,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.jewelerId = user.jewelerId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as typeof session.user.role;
        session.user.jewelerId = token.jewelerId as string | undefined;
      }
      return session;
    },
  },
});
