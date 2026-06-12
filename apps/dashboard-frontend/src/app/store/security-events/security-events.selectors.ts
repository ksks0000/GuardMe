import { createFeatureSelector } from '@ngrx/store';
import {
  securityEventsAdapter,
  securityEventsFeatureKey,
  SecurityEventsState,
} from './security-events.reducer';

export const selectSecurityEventsState =
  createFeatureSelector<SecurityEventsState>(securityEventsFeatureKey);

const adapterSelectors = securityEventsAdapter.getSelectors(selectSecurityEventsState);

export const selectAllSecurityEvents = adapterSelectors.selectAll;
export const selectSecurityEventEntities = adapterSelectors.selectEntities;
export const selectSecurityEventsTotal = adapterSelectors.selectTotal;
