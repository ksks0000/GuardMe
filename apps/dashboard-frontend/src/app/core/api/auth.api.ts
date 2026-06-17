import { Observable } from 'rxjs';
import { LoginCredentials, RegisterCredentials, UserProfile } from '../models';

export interface VerifyPasswordResult {
  lastAuthAt: string;
}

export abstract class AuthApi {
  abstract register(credentials: RegisterCredentials): Observable<UserProfile>;
  abstract login(credentials: LoginCredentials): Observable<UserProfile>;
  abstract logout(): Observable<void>;
  abstract getProfile(): Observable<UserProfile>;
  abstract verifyPassword(password: string): Observable<VerifyPasswordResult>;
}
