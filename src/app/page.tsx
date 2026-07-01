import { auth } from "@/auth";
import { repo } from "@/lib/repo";
import { Simulator } from "@/components/simulator";

export default async function Home() {
  const session = await auth();
  const user = session?.user ?? null;
  const jeweler = user?.jewelerId ? await repo.getJeweler(user.jewelerId) : null;
  return (
    <main className="flex-1">
      <Simulator user={user} displayName={jeweler?.name} />
    </main>
  );
}
