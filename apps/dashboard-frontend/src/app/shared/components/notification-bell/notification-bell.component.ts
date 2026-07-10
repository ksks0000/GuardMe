import { DatePipe, LowerCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { ThreatNotification } from '../../../core/models';
import { buildNotificationNavigationTarget } from '../../../core/utils/notification-navigation.util';
import { NotificationsActions } from '../../../store/notifications/notifications.actions';
import {
  selectAllNotifications,
  selectUnreadNotificationCount,
} from '../../../store/notifications/notifications.selectors';

@Component({
  selector: 'app-notification-bell',
  imports: [
    DatePipe,
    LowerCasePipe,
    MatBadgeModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatMenuModule,
    RouterLink,
  ],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent {
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  readonly notifications = toSignal(this.store.select(selectAllNotifications), {
    initialValue: [] as ThreatNotification[],
  });

  readonly unreadCount = toSignal(this.store.select(selectUnreadNotificationCount), {
    initialValue: 0,
  });

  onOpen(): void {
    if (this.unreadCount() > 0) {
      this.store.dispatch(NotificationsActions.markAllRead());
    }
  }

  openNotification(notification: ThreatNotification): void {
    this.store.dispatch(NotificationsActions.markRead({ id: notification.id }));
    const target = buildNotificationNavigationTarget(notification);
    void this.router.navigate(target.path, { queryParams: target.queryParams });
  }

  dismiss(event: Event, id: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.store.dispatch(NotificationsActions.dismissNotification({ id }));
  }
}
