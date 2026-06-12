import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, switchMap, take } from 'rxjs';
import { sanitizeReturnUrl } from '../utils/return-url.util';
import { selectAuthInitialized, selectIsAuthenticated } from '../../store/auth/auth.selectors';

export const guestGuard: CanActivateFn = (route) => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectAuthInitialized).pipe(
    filter((initialized) => initialized),
    take(1),
    switchMap(() => store.select(selectIsAuthenticated).pipe(take(1))),
    map((isAuthenticated) => {
      if (!isAuthenticated) {
        return true;
      }

      const returnUrl = route.queryParamMap.get('returnUrl');
      return router.createUrlTree([sanitizeReturnUrl(returnUrl)]);
    }),
  );
};
