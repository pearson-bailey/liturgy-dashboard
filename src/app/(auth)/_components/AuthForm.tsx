"use client";
import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { fetchJson } from "@/utils/http-client";
import { useRouter } from "next/navigation";
export function AuthForm({
  mode,
  configured = true,
  invalidLink = false,
}: {
  mode: "sign-in" | "forgot-password" | "update-password";
  configured?: boolean;
  invalidLink?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const titles = {
    "sign-in": "Welcome back",
    "forgot-password": "Reset your password",
    "update-password": "Choose your password",
  };
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">LITURGY / SCRIPTURE IN WORSHIP</p>
        <h1>{titles[mode]}</h1>
        <p className="muted">
          {mode === "sign-in"
            ? "A shared view of the Word in the life of your church. Access is by invitation."
            : mode === "forgot-password"
              ? "We’ll send a reset link if your email has an invited account."
              : "Set a password of at least 12 characters for your account."}
        </p>
        {!configured && (
          <p role="alert" className="notice">
            Authentication is not configured. Contact your administrator to
            complete local setup.
          </p>
        )}
        {invalidLink && (
          <p role="alert" className="notice">
            This invitation or reset link is invalid or expired. Request a new
            password reset, or ask your administrator for another invitation.
          </p>
        )}
        <form
          method="post"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setMessage("");
            const form = new FormData(event.currentTarget);
            try {
              await fetchJson(
                `/api/auth/${mode}`,
                z.object({ ok: z.boolean() }),
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(Object.fromEntries(form)),
                },
              );
              if (mode === "forgot-password")
                setMessage(
                  "If an invited account exists, a reset link has been sent. Check your email.",
                );
              else {
                router.replace("/dashboard");
                router.refresh();
              }
            } catch (error) {
              setMessage(
                error instanceof Error
                  ? error.message
                  : "Unable to connect. Please retry.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {mode !== "update-password" && (
            <label>
              Email address
              <input type="email" name="email" autoComplete="email" required />
            </label>
          )}
          {mode !== "forgot-password" && (
            <label>
              {mode === "update-password" ? "New password" : "Password"}
              <input
                type="password"
                name="password"
                autoComplete={
                  mode === "sign-in" ? "current-password" : "new-password"
                }
                minLength={mode === "update-password" ? 12 : 1}
                maxLength={128}
                required
              />
            </label>
          )}
          <button className="primary" disabled={busy || !configured}>
            {busy
              ? "Please wait…"
              : mode === "sign-in"
                ? "Sign in"
                : mode === "forgot-password"
                  ? "Send reset link"
                  : "Save password"}
          </button>
        </form>
        <p role="status" aria-live="polite">
          {message}
        </p>
        {mode === "sign-in" ? (
          <Link href="/forgot-password">Forgot your password?</Link>
        ) : (
          <Link href="/sign-in">Back to sign in</Link>
        )}
      </section>
      <p className="auth-footnote">
        Remember what has been read. Make room for what comes next.
      </p>
    </main>
  );
}
