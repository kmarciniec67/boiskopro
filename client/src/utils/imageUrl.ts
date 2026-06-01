/** Ścieżki /uploads/... są serwowane przez API; w dev Vite proxy przekazuje je na :3000. */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return url;
  return `/${url.replace(/^\//, '')}`;
}
