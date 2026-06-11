import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
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
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
