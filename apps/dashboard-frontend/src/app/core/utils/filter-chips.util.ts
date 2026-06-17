import { FilterFieldConfig, FilterValues } from '../../shared/models/filter-bar.model';

export interface ActiveFilterChip {
  key: string;
  label: string;
  value: string;
}

export function buildActiveFilterChips(
  filters: FilterValues,
  fields: FilterFieldConfig[],
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  fields.forEach((field) => {
    const raw = filters[field.key];
    if (raw === undefined || raw === null || String(raw).trim() === '') {
      return;
    }

    const text = String(raw).trim();
    const option = field.options?.find((entry) => entry.value === text);
    const displayValue = option?.label ?? text;

    chips.push({
      key: field.key,
      label: field.label,
      value: displayValue,
    });
  });

  return chips;
}
