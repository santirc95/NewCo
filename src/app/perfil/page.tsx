import { redirect } from "next/navigation";

// La sección de perfil vive ahora en el portal.
export default function PerfilRedirect() {
  redirect("/portal/facturacion");
}
