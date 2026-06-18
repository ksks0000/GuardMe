import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'traffic',
        loadChildren: () =>
          import('./features/traffic/traffic.routes').then((m) => m.TRAFFIC_ROUTES),
      },
      {
        path: 'security',
        loadChildren: () =>
          import('./features/security/security.routes').then((m) => m.SECURITY_ROUTES),
      },
      {
        path: 'rules',
        loadChildren: () =>
          import('./features/rules/rules.routes').then((m) => m.RULES_ROUTES),
      },
      {
        path: 'vault',
        loadChildren: () =>
          import('./features/vault/vault.routes').then((m) => m.VAULT_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
