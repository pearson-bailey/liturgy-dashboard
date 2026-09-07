import "server-only";
import { createRequestClient, refreshCookies } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { AppError } from "@/types/errors";
import type { NextRequest } from "next/server";

export async function currentUser(writable = false) {
  const client = await createRequestClient(writable);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? "Invited user" };
}
export async function requireUser() {
  const user = await currentUser();
  if (!user)
    throw new AppError(401, "Your session has expired. Please sign in again.");
  return user;
}
export function authConfigured() {
  try {
    getSupabaseConfig();
    return true;
  } catch {
    return false;
  }
}
export async function signIn(email: string, password: string) {
  const client = await createRequestClient(true);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error)
    throw new AppError(
      401,
      "Unable to sign in. Check your email and password, or request a reset.",
    );
}
export async function signOut() {
  const client = await createRequestClient(true);
  const { error } = await client.auth.signOut();
  if (error) throw new AppError(503, "Unable to sign out. Please retry.");
}
export async function requestPasswordReset(email: string) {
  const client = await createRequestClient(true);
  // The email template uses token_hash verification, supporting a different browser.
  const { error } = await client.auth.resetPasswordForEmail(email);
  if (error && error.status === 429)
    throw new AppError(
      429,
      "Too many requests. Please wait before trying again.",
    );
  if (error && (error.status ?? 500) >= 500)
    throw new AppError(
      503,
      "Email delivery is temporarily unavailable. Please retry.",
    );
  // Deliberately identical for existing and unknown accounts.
}
export async function updatePassword(password: string) {
  await requireUser();
  const client = await createRequestClient(true);
  const { error } = await client.auth.updateUser({ password });
  if (error)
    throw new AppError(
      400,
      "Unable to update your password. Use a new password or request another reset link.",
    );
}
export async function acceptCallback(input: {
  code?: string;
  token_hash?: string;
  type?: "invite" | "recovery";
}) {
  const client = await createRequestClient(true);
  const result = input.code
    ? await client.auth.exchangeCodeForSession(input.code)
    : input.token_hash && input.type
      ? await client.auth.verifyOtp({
          token_hash: input.token_hash,
          type: input.type,
        })
      : null;
  if (!result || result.error)
    throw new AppError(
      400,
      "This invitation or reset link is invalid or expired.",
    );
  return input.type === "invite" || input.type === "recovery"
    ? "/update-password"
    : "/dashboard";
}
export const refreshAuth = (request: NextRequest) => refreshCookies(request);
