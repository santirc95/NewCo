import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { repo } from "@/lib/repo";
import { PortalHeader } from "@/components/portal/portal-header";
import { PortalSidebar } from "@/components/portal/portal-sidebar";

export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;
  if (!user) redirect("/login");
  const jeweler = user.jewelerId
    ? ((await repo.getJeweler(user.jewelerId)) ?? null)
    : null;

  return (
    <main className="flex-1">
      <PortalHeader user={user} active="portal" displayName={jeweler?.name} />
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[220px_1fr] lg:gap-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <PortalSidebar />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
