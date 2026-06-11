import { Observable } from 'rxjs';
import { LoginCredentials, RegisterCredentials, UserProfile } from '../models';

export abstract class AuthApi {
  abstract register(credentials: RegisterCredentials): Observable<UserProfile>;
  abstract login(credentials: LoginCredentials): Observable<UserProfile>;
  abstract logout(): Observable<void>;
  abstract getProfile(): Observable<UserProfile>;
}
