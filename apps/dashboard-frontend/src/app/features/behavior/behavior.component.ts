import { AsyncPipe, DatePipe, LowerCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { Store } from '@ngrx/store';
import { buildTimeChartYAxisTicks } from '../../core/utils/analytics-chart.util';
import {
  activeHourIntensity,
  anomalyTimelineTooltip,
  buildRiskTrendYAxisTicks,
  formatInsightDate,
  riskTrendHeight,
  riskTrendTooltip,
  timelineBucketHeight,
} from '../../core/utils/ueba-chart.util';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { FilterBarComponent } from '../../shared/components/filter-bar/filter-bar.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { FilterFieldConfig, FilterValues } from '../../shared/models/filter-bar.model';
import { BehaviorActions } from '../../store/behavior/behavior.actions';
import {
  selectAnomalyItems,
  selectAnomalyPage,
  selectAnomalyPageSize,
  selectAnomalyTimeline,
  selectAnomalyTotal,
  selectBehaviorBaseline,
  selectBehaviorBaselineError,
  selectBehaviorBaselineLoading,
  selectBehaviorError,
  selectBehaviorPeriod,
  selectBehaviorPeriodLoading,
  selectMaxAnomalyTimelineCount,
  selectMaxRiskTrendAverage,
  selectPeriodAverageRisk,
  selectPeriodRequestCount,
  selectRiskTrend,
} from '../../store/behavior/behavior.selectors';
import { anomalySignalLabel, formatAnomalySignals } from './utils/anomaly-signal.util';
import { buildBehaviorQuery } from './utils/behavior-query.util';

@Component({
  selector: 'app-behavior',
  imports: [
    AsyncPipe,
    DatePipe,
    LowerCasePipe,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    FilterBarComponent,
    EmptyStateComponent,
    StatCardComponent,
  ],
  templateUrl: './behavior.component.html',
  styleUrl: './behavior.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BehaviorComponent implements OnInit {
  private readonly store = inject(Store);

  private currentFilters: FilterValues = {};

  readonly filterFields: FilterFieldConfig[] = [
    { key: 'from', label: 'From', type: 'datetime' },
    { key: 'to', label: 'To', type: 'datetime' },
  ];

  readonly baselineLoading$ = this.store.select(selectBehaviorBaselineLoading);
  readonly periodLoading$ = this.store.select(selectBehaviorPeriodLoading);
  readonly error$ = this.store.select(selectBehaviorError);
  readonly period$ = this.store.select(selectBehaviorPeriod);
  readonly baseline$ = this.store.select(selectBehaviorBaseline);
  readonly baselineError$ = this.store.select(selectBehaviorBaselineError);
  readonly anomalyTimeline$ = this.store.select(selectAnomalyTimeline);
  readonly riskTrend$ = this.store.select(selectRiskTrend);
  readonly anomalyItems$ = this.store.select(selectAnomalyItems);
  readonly anomalyTotal$ = this.store.select(selectAnomalyTotal);
  readonly anomalyPage$ = this.store.select(selectAnomalyPage);
  readonly anomalyPageSize$ = this.store.select(selectAnomalyPageSize);
  readonly maxTimelineCount$ = this.store.select(selectMaxAnomalyTimelineCount);
  readonly maxRiskTrendAverage$ = this.store.select(selectMaxRiskTrendAverage);
  readonly periodRequestCount$ = this.store.select(selectPeriodRequestCount);
  readonly periodAverageRisk$ = this.store.select(selectPeriodAverageRisk);

  readonly periodAverageRisk = toSignal(this.periodAverageRisk$, { initialValue: 0 });
  readonly periodRequestCount = toSignal(this.periodRequestCount$, { initialValue: 0 });

  readonly baselineHostColumns = ['host', 'count'];

  protected yAxisTicks = buildTimeChartYAxisTicks;
  protected riskTrendYAxisTicks = buildRiskTrendYAxisTicks;
  protected timelineHeight = timelineBucketHeight;
  protected riskHeight = riskTrendHeight;
  protected formatInsightDate = formatInsightDate;
  protected anomalyTooltip = anomalyTimelineTooltip;
  protected riskTooltip = riskTrendTooltip;
  protected hourIntensity = activeHourIntensity;
  protected formatAnomalySignals = formatAnomalySignals;
  protected anomalySignalLabel = anomalySignalLabel;

  maxOf(arr: number[]): number {
    return arr.length > 0 ? Math.max(...arr) : 0;
  }

  protected shouldShowLabel(index: number, total: number): boolean {
    if (total <= 14) return true;
    if (total <= 28) return index % 2 === 0;
    return index % 5 === 0 || index === total - 1;
  }

  protected anomalyScoreClass(score: number): string {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  protected severityIcon(severity: string): string {
    const map: Record<string, string> = {
      low: 'info_outline',
      medium: 'warning_amber',
      high: 'warning',
      critical: 'report',
    };
    return map[severity.toLowerCase()] ?? 'warning';
  }

  ngOnInit(): void {
    this.store.dispatch(BehaviorActions.loadBaseline());
    this.loadPeriod(1);
  }

  onFiltersApply(filters: FilterValues): void {
    this.currentFilters = filters;
    this.loadPeriod(1);
  }

  onPageChange(event: PageEvent): void {
    this.loadPeriod(event.pageIndex + 1);
  }

  private loadPeriod(page: number): void {
    this.store.dispatch(
      BehaviorActions.loadPeriod({
        query: buildBehaviorQuery(this.currentFilters, page),
      }),
    );
  }
}
