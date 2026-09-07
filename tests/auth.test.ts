import { beforeEach, describe, expect, it, vi } from "vitest";
const auth = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  verifyOtp: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createRequestClient: async () => ({ auth }),
  refreshCookies: vi.fn(),
}));
import { requestPasswordReset, acceptCallback } from "@/services/auth-service";
describe("password recovery", () => {
  beforeEach(() => vi.resetAllMocks());
  it("requests a recovery callback on the requesting deployment", async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    await requestPasswordReset(
      "user@example.test",
      "https://liturgy-dashboard.vercel.app",
    );
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "user@example.test",
      {
        redirectTo:
          "https://liturgy-dashboard.vercel.app/auth/confirm?type=recovery",
      },
    );
  });
  it("reports email throttling without claiming delivery", async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: { status: 429 } });
    await expect(
      requestPasswordReset("user@example.test", "https://example.test"),
    ).rejects.toThrow("email sending limit");
  });
  it("routes PKCE recovery to the password form", async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ error: null });
    expect(await acceptCallback({ code: "test-code", type: "recovery" })).toBe(
      "/update-password",
    );
  });
  it("verifies custom email tokens before opening the password form", async () => {
    auth.verifyOtp.mockResolvedValue({ error: null });
    expect(
      await acceptCallback({ token_hash: "test-token", type: "recovery" }),
    ).toBe("/update-password");
    expect(auth.verifyOtp).toHaveBeenCalledWith({
      token_hash: "test-token",
      type: "recovery",
    });
    auth.verifyOtp.mockResolvedValue({ error: { message: "expired" } });
    await expect(
      acceptCallback({ token_hash: "expired", type: "recovery" }),
    ).rejects.toThrow("invalid or expired");
  });
});
