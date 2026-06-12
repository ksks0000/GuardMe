import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { TrafficLog } from '../../core/models';

export const TrafficActions = createActionGroup({
  source: 'Traffic',
  events: {
    'Insert Log': props<{ log: TrafficLog }>(),
    'Update Log': props<{ log: TrafficLog }>(),
    'Clear Logs': emptyProps(),
  },
});
