import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/types";

declare module "next-auth" {
  interface Session {
    user: {
      role: Role;
      jewelerId?: string;
    } & DefaultSession["user"];
  }
  interface User {
    role: Role;
    jewelerId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    jewelerId?: string;
  }
}
