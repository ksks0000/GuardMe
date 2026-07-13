import { FilterValues } from '../../../shared/models/filter-bar.model';
import { UebaAnomaliesQuery } from '../../../core/models/ueba.model';
import { buildDateRangeFromFilters } from '../../../core/utils/date-filter.util';

export function buildBehaviorQuery(
  filters: FilterValues,
  page = 1,
  pageSize = 15,
): UebaAnomaliesQuery {
  return {
    ...buildDateRangeFromFilters(filters),
    page,
    pageSize,
  };
}
