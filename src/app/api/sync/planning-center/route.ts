import { synchronizePlanningCenter } from "@/services/planning-center-sync-service";
import { requireUser } from "@/services/auth-service";
import {
  apiResponse,
  requireSameOrigin,
} from "../../_utils/api-response.utils";
export async function POST(request: Request) {
  return apiResponse(async () => {
    requireSameOrigin(request);
    await requireUser();
    return synchronizePlanningCenter();
  });
}
