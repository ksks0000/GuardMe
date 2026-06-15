const MAX_SEARCH_LENGTH = 200;

// Strips control characters and caps length for safe DB substring filters
export function sanitizeSearchTerm(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '')
    .slice(0, MAX_SEARCH_LENGTH);

  return trimmed.length > 0 ? trimmed : undefined;
}
