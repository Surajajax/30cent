export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export function getApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function getBackendErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (error instanceof TypeError) {
    return "Unable to connect to 30cent backend.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
