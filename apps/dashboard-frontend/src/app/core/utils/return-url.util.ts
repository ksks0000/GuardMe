// Prevents open redirect - only paths relative to the app are allowed
export function sanitizeReturnUrl(url: string | null | undefined): string {
  if (!url || !url.startsWith('/') || url.startsWith('//') || url.includes('://')) {
    return '/dashboard';
  }

  return url;
}
