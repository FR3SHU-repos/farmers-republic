export function apiBase(value: string | undefined, fallback = "http://localhost:8080"): string {
  const raw = (value?.trim() || fallback).replace(/\/+$/, "");
  return raw.replace(/\/api\/v1$/i, "");
}

export function apiURL(base: string, path: string): string {
  const clean = path.replace(/^\/+/, "");
  return `${apiBase(base)}/api/v1/${clean}`;
}
