import { syncStatus } from "@/services/planning-center-sync-service";
import { apiResponse } from "../../_utils/api-response.utils";
export async function GET() {
  return apiResponse(syncStatus);
}
