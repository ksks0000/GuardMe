import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { SecurityEvent } from '../../core/models';

export const SecurityEventsActions = createActionGroup({
  source: 'Security Events',
  events: {
    'Insert Event': props<{ event: SecurityEvent }>(),
    'Update Event': props<{ event: SecurityEvent }>(),
    'Clear Events': emptyProps(),
  },
});
