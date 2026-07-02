import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Landing: redirige por rol. (El middleware ya exige sesión.)
export default async function Home() {
  const session = await auth();
  if (session?.user?.role === "admin") redirect("/admin");
  redirect("/inventario");
}
