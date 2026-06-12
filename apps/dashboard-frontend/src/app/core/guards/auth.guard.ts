import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, switchMap, take } from 'rxjs';
import { selectAuthInitialized, selectIsAuthenticated } from '../../store/auth/auth.selectors';

export const authGuard: CanActivateFn = (_route, state) => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectAuthInitialized).pipe(
    filter((initialized) => initialized),
    take(1),
    switchMap(() => store.select(selectIsAuthenticated).pipe(take(1))),
    map((isAuthenticated) =>
      isAuthenticated
        ? true
        : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }),
    ),
  );
};
