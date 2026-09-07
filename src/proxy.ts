import { refreshAuth } from "@/services/auth-service";
import type { NextRequest } from "next/server";
export function proxy(request: NextRequest) {
  return refreshAuth(request);
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
