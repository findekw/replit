/**
 * Returns the base URL prefix for all API calls.
 *
 * - Production (Vercel): uses VITE_API_URL env var
 *   e.g. "https://your-api.vercel.app"
 * - Development (Replit): uses BASE_URL path prefix;
 *   Vite proxy forwards /api → localhost API server automatically.
 */
export function getApiBase(): string {
  const apiUrl = import.meta.env["VITE_API_URL"];
  if (apiUrl) return String(apiUrl).replace(/\/+$/, "");
  return import.meta.env.BASE_URL.replace(/\/+$/, "");
}
