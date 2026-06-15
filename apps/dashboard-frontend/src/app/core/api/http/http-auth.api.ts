import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoginCredentials, RegisterCredentials, UserProfile } from '../../models';
import { AuthApi } from '../auth.api';
import { mapAuthMeProfile, mapPublicUserProfile } from './auth-api.mapper';
import { AuthMeResponse, PublicUserProfileResponse } from './auth-api.types';

@Injectable()
export class HttpAuthApi extends AuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  register(credentials: RegisterCredentials): Observable<UserProfile> {
    return this.http
      .post<PublicUserProfileResponse>(`${this.baseUrl}/register`, credentials)
      .pipe(map(mapPublicUserProfile));
  }

  login(credentials: LoginCredentials): Observable<UserProfile> {
    return this.http
      .post<PublicUserProfileResponse>(`${this.baseUrl}/login`, credentials)
      .pipe(map(mapPublicUserProfile));
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/logout`, null).pipe(map(() => undefined));
  }

  getProfile(): Observable<UserProfile> {
    return this.http
      .get<AuthMeResponse>(`${this.baseUrl}/me`)
      .pipe(map(mapAuthMeProfile));
  }
}
