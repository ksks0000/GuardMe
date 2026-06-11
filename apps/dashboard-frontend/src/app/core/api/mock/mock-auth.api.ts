import { Injectable } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';
import { AuthApi } from '../auth.api';
import { LoginCredentials, RegisterCredentials, UserProfile } from '../../models';

const LATENCY_MS = 400;

@Injectable()
export class MockAuthApi extends AuthApi {
  private users = new Map<string, { password: string; profile: UserProfile }>();
  private currentUser: UserProfile | null = null;

  constructor() {
    super();
    const demoProfile: UserProfile = {
      id: '00000000-0000-4000-8000-000000000099',
      username: 'demo',
      createdAt: new Date('2026-01-15T10:00:00.000Z').toISOString(),
      lastAuthAt: null,
    };
    this.users.set('demo', { password: 'password123', profile: demoProfile });
  }

  register(credentials: RegisterCredentials): Observable<UserProfile> {
    if (this.users.has(credentials.username)) {
      return throwError(() => new Error('Username already exists')).pipe(delay(LATENCY_MS));
    }

    const profile: UserProfile = {
      id: crypto.randomUUID(),
      username: credentials.username,
      createdAt: new Date().toISOString(),
      lastAuthAt: null,
    };

    this.users.set(credentials.username, {
      password: credentials.password,
      profile,
    });

    return of(profile).pipe(delay(LATENCY_MS));
  }

  login(credentials: LoginCredentials): Observable<UserProfile> {
    const entry = this.users.get(credentials.username);
    if (!entry || entry.password !== credentials.password) {
      return throwError(() => new Error('Invalid username or password')).pipe(delay(LATENCY_MS));
    }

    const profile: UserProfile = {
      ...entry.profile,
      lastAuthAt: new Date().toISOString(),
    };
    entry.profile = profile;
    this.currentUser = profile;

    return of(profile).pipe(delay(LATENCY_MS));
  }

  logout(): Observable<void> {
    this.currentUser = null;
    return of(void 0).pipe(delay(LATENCY_MS));
  }

  getProfile(): Observable<UserProfile> {
    if (!this.currentUser) {
      return throwError(() => new Error('Not authenticated')).pipe(delay(LATENCY_MS));
    }

    return of(this.currentUser).pipe(delay(LATENCY_MS));
  }
}
