import { auth } from "@/auth";
import { repo } from "@/lib/repo";
import { PaymentManager } from "@/components/portal/payment-manager";

export const dynamic = "force-dynamic";

export default async function PagosPage() {
  const session = await auth();
  const jewelerId = session?.user?.jewelerId;
  const methods = jewelerId ? await repo.listPaymentMethods(jewelerId) : [];

  return (
    <div>
      <h1 className="text-[20px] font-bold text-[var(--on-surface)]">
        Métodos de pago
      </h1>
      <p className="mt-1 mb-6 text-[12.5px] text-[var(--on-surface-variant)]">
        Tus métodos para pagar a NewCo. Solo guardamos una referencia tokenizada,
        nunca datos crudos.
      </p>
      <PaymentManager initial={methods} />
    </div>
  );
}
