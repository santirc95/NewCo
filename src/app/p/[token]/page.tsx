import type { Metadata } from "next";
import { ProposalView } from "@/components/proposal/proposal-view";

// White-label: el título no menciona a NewCo.
export const metadata: Metadata = {
  title: "Tu selección privada",
  robots: { index: false, follow: false },
};

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <main className="flex-1">
      <ProposalView token={token} />
    </main>
  );
}
