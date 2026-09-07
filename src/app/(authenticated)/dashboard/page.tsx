import { redirect } from "next/navigation";
import { Suspense } from "react";
import { authConfigured, currentUser } from "@/services/auth-service";
import { Dashboard } from "./_components/Dashboard";
export default async function DashboardPage() {
  if (!authConfigured()) redirect("/sign-in");
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  return (
    <Suspense
      fallback={
        <main>
          <p role="status">Loading dashboard…</p>
        </main>
      }
    >
      <Dashboard email={user.email} />
    </Suspense>
  );
}
