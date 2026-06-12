import { credentialsInterceptor } from './credentials.interceptor';
import { authErrorInterceptor } from './auth-error.interceptor';

export const httpInterceptors = [credentialsInterceptor, authErrorInterceptor];
