export function apiUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${base}${normalizedPath}`;
}

