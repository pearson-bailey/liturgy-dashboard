import { NextResponse } from "next/server";
import { z } from "zod";
import { acceptCallback } from "@/services/auth-service";
import { requestOrigin } from "../../api/_utils/api-response.utils";
const callbackSchema = z.object({
  code: z.string().min(1).optional(),
  token_hash: z.string().min(1).optional(),
  type: z.enum(["invite", "recovery"]).optional(),
});
export async function GET(request: Request) {
  try {
    const path = await acceptCallback(
      callbackSchema.parse(
        Object.fromEntries(new URL(request.url).searchParams),
      ),
    );
    return NextResponse.redirect(new URL(path, requestOrigin(request)));
  } catch {
    return NextResponse.redirect(
      new URL("/sign-in?error=invalid-link", requestOrigin(request)),
    );
  }
}
