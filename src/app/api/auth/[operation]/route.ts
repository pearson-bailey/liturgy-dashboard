import {
  signIn,
  signOut,
  requestPasswordReset,
  updatePassword,
} from "@/services/auth-service";
import { AppError } from "@/types/errors";
import {
  apiResponse,
  requireSameOrigin,
} from "../../_utils/api-response.utils";
import {
  credentialsSchema,
  emailSchema,
  passwordSchema,
} from "./_utils/auth-input.schema";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ operation: string }> },
) {
  return apiResponse(async () => {
    requireSameOrigin(request);
    const { operation } = await params;
    if (operation === "sign-in") {
      const data = credentialsSchema.parse(await request.json());
      await signIn(data.email, data.password);
    } else if (operation === "sign-out") await signOut();
    else if (operation === "forgot-password")
      await requestPasswordReset(emailSchema.parse(await request.json()).email);
    else if (operation === "update-password")
      await updatePassword(passwordSchema.parse(await request.json()).password);
    else throw new AppError(404, "Unknown authentication operation.");
    return { ok: true };
  });
}
