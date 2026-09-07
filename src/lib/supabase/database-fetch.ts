import "server-only";

// Local Auth and PostgREST containers can briefly disagree about a new JWT's
// issued-at second. Retry only a rejected read, never a write or other auth failure.
export async function databaseFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);
  const method =
    init?.method ?? (input instanceof Request ? input.method : "GET");
  if (response.status !== 401 || method.toUpperCase() !== "GET")
    return response;
  const body: unknown = await response
    .clone()
    .json()
    .catch(() => null);
  if (
    body &&
    typeof body === "object" &&
    "code" in body &&
    body.code === "PGRST303" &&
    "message" in body &&
    body.message === "JWT issued at future"
  ) {
    await new Promise((resolve) => setTimeout(resolve, 1100));
    return fetch(input, init);
  }
  return response;
}
