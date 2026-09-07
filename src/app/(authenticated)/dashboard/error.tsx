"use client";
import Link from "next/link";
export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <main>
      <h1>Unable to load the dashboard</h1>
      <p>Please check your connection and try again.</p>
      <button onClick={reset}>Try again</button>{" "}
      <Link href="/sign-in">Sign in again</Link>
    </main>
  );
}
