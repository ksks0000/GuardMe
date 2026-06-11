import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthApi } from './auth.api';
import { RealtimeApi } from './realtime.api';
import { SiemApi } from './siem.api';
import {
  LoginCredentials,
  PaginatedResult,
  RegisterCredentials,
  SecurityEvent,
  SecurityEventQuery,
  TrafficLog,
  TrafficLogQuery,
  UserProfile,
} from '../models';

const MESSAGE = 'Real API not configured yet. Set useMocks: true.';

@Injectable()
export class UnconfiguredAuthApi extends AuthApi {
  register(_credentials: RegisterCredentials): Observable<UserProfile> {
    return throwError(() => new Error(MESSAGE));
  }

  login(_credentials: LoginCredentials): Observable<UserProfile> {
    return throwError(() => new Error(MESSAGE));
  }

  logout(): Observable<void> {
    return throwError(() => new Error(MESSAGE));
  }

  getProfile(): Observable<UserProfile> {
    return throwError(() => new Error(MESSAGE));
  }
}

@Injectable()
export class UnconfiguredSiemApi extends SiemApi {
  getTrafficLogs(_query: TrafficLogQuery): Observable<PaginatedResult<TrafficLog>> {
    return throwError(() => new Error(MESSAGE));
  }

  getSecurityEvents(_query: SecurityEventQuery): Observable<PaginatedResult<SecurityEvent>> {
    return throwError(() => new Error(MESSAGE));
  }
}

@Injectable()
export class UnconfiguredRealtimeApi extends RealtimeApi {
  readonly trafficLogs$ = throwError(() => new Error(MESSAGE));
  readonly securityEvents$ = throwError(() => new Error(MESSAGE));
  readonly systemStatus$ = throwError(() => new Error(MESSAGE));
  readonly sessionEvents$ = throwError(() => new Error(MESSAGE));

  connect(): void {
    throw new Error(MESSAGE);
  }

  disconnect(): void {
    // no-op
  }
}
