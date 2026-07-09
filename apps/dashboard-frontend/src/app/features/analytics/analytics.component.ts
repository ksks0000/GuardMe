import { AsyncPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { Store } from '@ngrx/store';
import {
  blockedSharePercent,
  bucketTooltip,
  buildTimeChartYAxisTicks,
  chartSegmentWidthPercent,
  formatBucketLabel,
  seriesTotal,
  timeBucketHeightPercent,
} from '../../core/utils/analytics-chart.util';
import { buildAnalyticsSummaryQuery } from '../../core/utils/analytics-query.util';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { FilterBarComponent } from '../../shared/components/filter-bar/filter-bar.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { FilterFieldConfig, FilterValues } from '../../shared/models/filter-bar.model';
import { AnalyticsActions } from '../../store/analytics/analytics.actions';
import {
  selectAnalyticsError,
  selectAnalyticsLoading,
  selectAnalyticsPeriod,
  selectAnalyticsRiskStats,
  selectAnalyticsSecurityTotal,
  selectAnalyticsSummary,
  selectAnalyticsSystemStatus,
  selectAnalyticsTrafficTotal,
  selectMaxTimeBucketRequests,
  selectPolicyDecisionSeries,
  selectSecurityEventTypeSeries,
  selectSecuritySeveritySeries,
  selectThreatVerdictSeries,
  selectTimeBuckets,
  selectTopDestinationHosts,
} from '../../store/analytics/analytics.selectors';

@Component({
  selector: 'app-analytics',
  imports: [
    AsyncPipe,
    DatePipe,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTableModule,
    FilterBarComponent,
    EmptyStateComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsComponent implements OnInit {
  private readonly store = inject(Store);

  readonly filterFields: FilterFieldConfig[] = [
    { key: 'from', label: 'From', type: 'datetime' },
    { key: 'to', label: 'To', type: 'datetime' },
  ];

  readonly loading$ = this.store.select(selectAnalyticsLoading);
  readonly error$ = this.store.select(selectAnalyticsError);
  readonly summary$ = this.store.select(selectAnalyticsSummary);
  readonly systemStatus$ = this.store.select(selectAnalyticsSystemStatus);
  readonly period$ = this.store.select(selectAnalyticsPeriod);
  readonly trafficTotal$ = this.store.select(selectAnalyticsTrafficTotal);
  readonly securityTotal$ = this.store.select(selectAnalyticsSecurityTotal);
  readonly riskStats$ = this.store.select(selectAnalyticsRiskStats);
  readonly decisionSeries$ = this.store.select(selectPolicyDecisionSeries);
  readonly verdictSeries$ = this.store.select(selectThreatVerdictSeries);
  readonly severitySeries$ = this.store.select(selectSecuritySeveritySeries);
  readonly eventTypeSeries$ = this.store.select(selectSecurityEventTypeSeries);
  readonly topHosts$ = this.store.select(selectTopDestinationHosts);
  readonly timeBuckets$ = this.store.select(selectTimeBuckets);
  readonly maxBucketRequests$ = this.store.select(selectMaxTimeBucketRequests);

  readonly riskStats = toSignal(this.riskStats$, {
    initialValue: { average: 0, max: 0, highRiskCount: 0 },
  });

  readonly topHostColumns = ['host', 'count'];

  protected bucketHeight = timeBucketHeightPercent;
  protected blockedShare = blockedSharePercent;
  protected segmentWidth = chartSegmentWidthPercent;
  protected yAxisTicks = buildTimeChartYAxisTicks;
  protected seriesTotal = seriesTotal;
  protected formatBucketLabel = formatBucketLabel;
  protected bucketTooltip = bucketTooltip;

  ngOnInit(): void {
    this.store.dispatch(AnalyticsActions.loadSummary({ query: {} }));
  }

  onFiltersApply(filters: FilterValues): void {
    this.store.dispatch(
      AnalyticsActions.loadSummary({ query: buildAnalyticsSummaryQuery(filters) }),
    );
  }
}
