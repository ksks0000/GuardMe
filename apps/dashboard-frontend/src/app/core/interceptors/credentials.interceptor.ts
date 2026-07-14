import { HttpInterceptorFn } from '@angular/common/http';
import { isApiRequest } from '../utils/api-request.util';

// Sends HttpOnly session cookies on API requests only (not other URLs)
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }

  return next(
    req.clone({
      withCredentials: true,
    }),
  );
};
