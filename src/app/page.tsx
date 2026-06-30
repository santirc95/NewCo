import { auth } from "@/auth";
import { Simulator } from "@/components/simulator";

export default async function Home() {
  const session = await auth();
  return (
    <main className="flex-1">
      <Simulator user={session?.user ?? null} />
    </main>
  );
}
