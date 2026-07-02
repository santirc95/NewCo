import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { repo } from "@/lib/repo";
import { OrderDetail } from "@/components/portal/order-detail";

export const dynamic = "force-dynamic";

export default async function CompraDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const jewelerId = session?.user?.jewelerId;
  const order = await repo.getOrder(id);
  if (!order || order.jewelerId !== jewelerId) notFound();

  return <OrderDetail order={order} />;
}
