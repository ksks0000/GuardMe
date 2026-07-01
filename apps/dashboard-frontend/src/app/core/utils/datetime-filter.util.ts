export function splitIsoToDateTimeParts(iso: string): {
  date: Date | null;
  time: string;
} {
  if (!iso) {
    return { date: null, time: '' };
  }

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return { date: null, time: '' };
  }

  const hours = parsed.getHours().toString().padStart(2, '0');
  const minutes = parsed.getMinutes().toString().padStart(2, '0');

  return {
    date: new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()),
    time: `${hours}:${minutes}`,
  };
}

// Parses HH:mm or H:mm in 24-hour format
export function parseTime24h(value: string | undefined): { hours: number; minutes: number } | null {
  if (!value?.trim()) {
    return null;
  }

  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
}

export function combineDateAndTime(
  date: Date | null | undefined,
  time: string | undefined,
): string {
  if (!date) {
    return '';
  }

  const parsedTime = parseTime24h(time);
  const combined = new Date(date);

  combined.setHours(parsedTime?.hours ?? 0, parsedTime?.minutes ?? 0, 0, 0);
  return combined.toISOString();
}

export function dateControlKey(fieldKey: string): string {
  return `${fieldKey}__date`;
}

export function timeControlKey(fieldKey: string): string {
  return `${fieldKey}__time`;
}
