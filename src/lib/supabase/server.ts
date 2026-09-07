import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getSecretKey, getSupabaseConfig } from "./config";
import type { Database } from "@/types/database";
import { databaseFetch } from "./database-fetch";

export async function createRequestClient(writable = false) {
  const config = getSupabaseConfig();
  const store = await cookies();
  return createServerClient<Database>(config.url, config.publishableKey, {
    global: { fetch: databaseFetch },
    cookieOptions: { httpOnly: true, sameSite: "lax" },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values) => {
        if (writable)
          for (const { name, value, options } of values)
            store.set(name, value, options);
      },
    },
  });
}
export function createAdminClient() {
  return createClient<Database>(getSupabaseConfig().url, getSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function refreshCookies(request: NextRequest) {
  let response = NextResponse.next({ request });
  let config;
  try {
    config = getSupabaseConfig();
  } catch {
    return response;
  }
  const client = createServerClient<Database>(
    config.url,
    config.publishableKey,
    {
      cookieOptions: { httpOnly: true, sameSite: "lax" },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values) => {
          for (const { name, value } of values)
            request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of values)
            response.cookies.set(name, value, options);
        },
      },
    },
  );
  await client.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
