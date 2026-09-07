import { chapterDetails } from "@/services/scripture-usage-service";
import { requireUser } from "@/services/auth-service";
import {
  parseDashboardFilters,
  chapterQuerySchema,
} from "@/schema/dashboard-filters";
import { apiResponse } from "../../_utils/api-response.utils";
export async function GET(request: Request) {
  return apiResponse(async () => {
    await requireUser();
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const chapter = chapterQuerySchema.parse(query);
    return chapterDetails(
      parseDashboardFilters(new URL(request.url).searchParams),
      chapter.selectedBook,
      chapter.chapter,
      chapter.offset,
    );
  });
}
