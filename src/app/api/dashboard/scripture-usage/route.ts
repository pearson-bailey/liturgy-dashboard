import { dashboardUsage } from "@/services/scripture-usage-service";
import { requireUser } from "@/services/auth-service";
import { parseDashboardFilters } from "@/schema/dashboard-filters";
import { apiResponse } from "../../_utils/api-response.utils";
export async function GET(request: Request) {
  return apiResponse(async () => {
    await requireUser();
    return dashboardUsage(
      parseDashboardFilters(new URL(request.url).searchParams),
    );
  });
}
