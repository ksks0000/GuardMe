import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { LogListComponent } from '../../shared/components/log-list/log-list.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { selectActivityFeed } from '../../store/dashboard/dashboard.selectors';
import { selectSecurityEventsTotal } from '../../store/security-events/security-events.selectors';
import {
  selectAllowedCount,
  selectBlockedCount,
  selectTrafficTotal,
  selectTrafficVerdictStats,
} from '../../store/traffic/traffic.selectors';
import { selectSystemStatus } from '../../store/system-status/system-status.selectors';

@Component({
  selector: 'app-dashboard',
  imports: [
    AsyncPipe,
    DatePipe,
    MatCardModule,
    MatChipsModule,
    StatCardComponent,
    StatusBadgeComponent,
    LogListComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly store = inject(Store);

  readonly activityFeed$ = this.store.select(selectActivityFeed);
  readonly verdictStats$ = this.store.select(selectTrafficVerdictStats);
  readonly allowed$ = this.store.select(selectAllowedCount);
  readonly blocked$ = this.store.select(selectBlockedCount);
  readonly trafficTotal$ = this.store.select(selectTrafficTotal);
  readonly securityTotal$ = this.store.select(selectSecurityEventsTotal);
  readonly systemStatus$ = this.store.select(selectSystemStatus);

  readonly verdictStats = toSignal(this.verdictStats$, {
    initialValue: { safe: 0, suspicious: 0, malicious: 0, unverified: 0, total: 0 },
  });
}
