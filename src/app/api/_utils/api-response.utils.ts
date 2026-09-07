import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/types/errors";
export async function apiResponse(work: () => Promise<unknown>) {
  try {
    return NextResponse.json(await work(), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const status =
      error instanceof AppError
        ? error.status
        : error instanceof ZodError || error instanceof SyntaxError
          ? 400
          : 500;
    const message =
      error instanceof AppError
        ? error.message
        : status === 400
          ? "The request contains invalid input."
          : "The operation failed. Please retry or contact your administrator.";
    return NextResponse.json(
      { error: message },
      { status, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== requestOrigin(request))
    throw new AppError(403, "This request must come from the application.");
}
export function requestOrigin(request: Request) {
  // Next's internal URL can use localhost behind the dev proxy. Host remains the
  // browser-facing authority; do not trust arbitrary forwarded-host headers.
  const url = new URL(request.url);
  const host = request.headers.get("host");
  return host ? new URL(`${url.protocol}//${host}`).origin : url.origin;
}
