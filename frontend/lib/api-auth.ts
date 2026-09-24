import { supabase } from "@/lib/supabase";
import { getApiUrl } from "@/lib/api";

export async function authenticatedFetch(
  path: string,
  options: RequestInit = {},
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("User is not authenticated.");
  }

  const headers = new Headers(options.headers);

  headers.set(
    "Authorization",
    `Bearer ${session.access_token}`,
  );

  headers.set("Content-Type", "application/json");

  return fetch(getApiUrl(path), {
    ...options,
    headers,
  });
}