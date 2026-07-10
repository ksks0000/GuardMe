import { FilterValues } from '../../../shared/models/filter-bar.model';
import { UebaAnomaliesQuery } from '../../../core/models/ueba.model';

function optionalIsoDate(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function buildBehaviorQuery(
  filters: FilterValues,
  page = 1,
  pageSize = 15,
): UebaAnomaliesQuery {
  return {
    from: optionalIsoDate(filters['from']),
    to: optionalIsoDate(filters['to']),
    page,
    pageSize,
  };
}
