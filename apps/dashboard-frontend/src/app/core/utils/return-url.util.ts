/** Prevents open-redirect: only same-app relative paths are allowed. */
export function sanitizeReturnUrl(url: string | null | undefined): string {
  if (!url || !url.startsWith('/') || url.startsWith('//') || url.includes('://')) {
    return '/dashboard';
  }

  return url;
}
