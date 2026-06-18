export function toCountRecord<T extends string>(
  keys: readonly T[],
  rows: Array<{ key: string; count: number }>,
): Record<T, number> {
  const counts = Object.fromEntries(keys.map((key) => [key, 0])) as Record<
    T,
    number
  >;

  for (const row of rows) {
    if (row.key in counts) {
      counts[row.key as T] = row.count;
    }
  }

  return counts;
}

export function roundRiskAverage(value: number | null): number {
  if (value === null) {
    return 0;
  }

  return Math.round(value * 10) / 10;
}
