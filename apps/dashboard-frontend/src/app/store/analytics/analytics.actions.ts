import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { AnalyticsSummary, AnalyticsSummaryQuery, SystemStatus } from '../../core/models';

export const AnalyticsActions = createActionGroup({
  source: 'Analytics',
  events: {
    'Load Summary': props<{ query: AnalyticsSummaryQuery }>(),
    'Load Summary Success': props<{
      summary: AnalyticsSummary;
      systemStatus: SystemStatus | null;
    }>(),
    'Load Summary Failure': props<{ error: string }>(),
    'Clear Error': emptyProps(),
  },
});
