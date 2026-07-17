import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../../core/theme/theme.service';
import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell.component';
import { AuthActions } from '../../store/auth/auth.actions';
import { selectIsReAuthStale, selectUsername } from '../../store/auth/auth.selectors';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

const NAV_LINK_ACTIVE_OPTIONS = {
  paths: 'exact',
  queryParams: 'ignored',
  fragment: 'ignored',
  matrixParams: 'ignored',
} as const;

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatTooltipModule,
    NotificationBellComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private readonly store = inject(Store);
  private readonly themeService = inject(ThemeService);

  readonly username = toSignal(this.store.select(selectUsername), { initialValue: null });

  readonly reAuthStale = toSignal(this.store.select(selectIsReAuthStale), { initialValue: false });

  readonly themeMode = this.themeService.mode;

  readonly navLinkActiveOptions = NAV_LINK_ACTIVE_OPTIONS;

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Traffic', route: '/traffic', icon: 'language' },
    { label: 'Rules', route: '/rules', icon: 'rule' },
    { label: 'Security', route: '/security', icon: 'security' },
    { label: 'Analytics', route: '/analytics', icon: 'insights' },
    { label: 'Behavior', route: '/behavior', icon: 'psychology' },
    { label: 'Vault', route: '/vault', icon: 'key' },
  ];

  toggleTheme(): void {
    this.themeService.toggle();
  }

  openReAuthDialog(): void {
    this.store.dispatch(AuthActions.reauthRequired());
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
