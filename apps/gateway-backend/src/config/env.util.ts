export function parsePositiveNumber(
  value: string | undefined,
  defaultValue: number,
): number {
  const parsed = Number(value);
  const safeDefault =
    Number.isFinite(defaultValue) && defaultValue > 0 ? defaultValue : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : safeDefault;
}
