import { dashboardOptions } from "@/services/scripture-usage-service";
import { apiResponse } from "../../_utils/api-response.utils";
import { dashboardFiltersSchema } from "@/schema/dashboard-filters";
export async function GET(request: Request) {
  return apiResponse(() => {
    const params = new URL(request.url).searchParams;
    const dates = dashboardFiltersSchema.parse({
      from: params.get("from") ?? undefined,
      to: params.get("to") ?? undefined,
    });
    return dashboardOptions(dates);
  });
}
