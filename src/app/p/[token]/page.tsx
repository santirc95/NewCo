import type { Metadata } from "next";
import { proposalStore } from "@/lib/store";
import { getMockStone } from "@/lib/inventory";
import { ProposalView } from "@/components/proposal/proposal-view";
import type { Stone } from "@/lib/types";

// El store es en memoria: render dinámico, sin caché.
export const dynamic = "force-dynamic";

// Vista neutral: el título no menciona a NewCo.
export const metadata: Metadata = {
  title: "Tu selección",
  robots: { index: false, follow: false },
};

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const proposal = proposalStore.get(token);
  const stones: Stone[] = proposal
    ? proposal.stoneIds
        .map((id) => getMockStone(id))
        .filter((s): s is Stone => Boolean(s))
    : [];

  return (
    <main className="flex-1">
      <ProposalView
        token={token}
        proposal={
          proposal
            ? {
                clientName: proposal.clientName,
                signaledStoneId: proposal.signaledStoneId,
                jewelerWhatsapp: proposal.jewelerWhatsapp,
              }
            : null
        }
        stones={stones}
      />
    </main>
  );
}
