import { DestroyRef, Component, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { switchMap, timer } from 'rxjs';
import { AuthActions } from '../../store/auth/auth.actions';
import { selectIsReAuthStale, selectUsername } from '../../store/auth/auth.selectors';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

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
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);

  readonly username = toSignal(this.store.select(selectUsername), { initialValue: null });

  readonly reAuthStale = toSignal(
    timer(0, 30_000).pipe(
      switchMap(() => this.store.select(selectIsReAuthStale)),
      takeUntilDestroyed(this.destroyRef),
    ),
    { initialValue: false },
  );

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Traffic', route: '/traffic', icon: 'language' },
    { label: 'Rules', route: '/rules', icon: 'rule' },
    { label: 'Security', route: '/security', icon: 'security' },
    { label: 'Vault', route: '/vault', icon: 'key' },
  ];

  openReAuthDialog(): void {
    this.store.dispatch(AuthActions.reauthRequired());
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
