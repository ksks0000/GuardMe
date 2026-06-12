import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { SystemStatus } from '../../core/models';

export const SystemStatusActions = createActionGroup({
  source: 'System Status',
  events: {
    'Update Status': props<{ status: SystemStatus }>(),
    'Clear Status': emptyProps(),
  },
});
