import { AsyncPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs';
import { SiemApi } from '../../core/api/siem.api';
import { THREAT_VERDICTS, TrafficLog } from '../../core/models';
import { buildTrafficLogQuery } from '../../core/utils/history-query.util';
import { computeTrafficPageStats, TrafficPageStats } from '../../core/utils/traffic-stats.util';
import { truncateUrl } from '../../core/utils/url-display.util';
import {
  normalizeTrafficVerdict,
  trafficVerdictCssClass,
} from '../../core/utils/traffic-verdict.util';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { FilterBarComponent } from '../../shared/components/filter-bar/filter-bar.component';
import { FilterFieldConfig, FilterValues } from '../../shared/models/filter-bar.model';

const PAGE_SIZE = 15;

const EMPTY_FILTERS: FilterValues = {
  verdict: '',
  urlSearch: '',
  from: '',
  to: '',
};

type TrafficViewState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'success';
      total: number;
      page: number;
      pageStats: TrafficPageStats;
      items: TrafficLog[];
    };

@Component({
  selector: 'app-traffic',
  imports: [
    AsyncPipe,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    FilterBarComponent,
    EmptyStateComponent,
  ],
  templateUrl: './traffic.component.html',
  styleUrl: './traffic.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrafficComponent {
  private readonly siemApi = inject(SiemApi);

  readonly pageSize = PAGE_SIZE;
  readonly displayedColumns = ['timestamp', 'method', 'url', 'verdict', 'riskScore', 'host'];

  readonly filterFields: FilterFieldConfig[] = [
    {
      key: 'verdict',
      label: 'Verdict',
      type: 'select',
      options: [
        { label: 'All', value: '' },
        { label: 'Safe', value: THREAT_VERDICTS.SAFE },
        { label: 'Suspicious', value: THREAT_VERDICTS.SUSPICIOUS },
        { label: 'Malicious', value: THREAT_VERDICTS.MALICIOUS },
        { label: 'Unverified', value: THREAT_VERDICTS.UNVERIFIED },
      ],
    },
    {
      key: 'urlSearch',
      label: 'URL search',
      type: 'text',
      placeholder: 'Host or URL fragment',
    },
    {
      key: 'from',
      label: 'From',
      type: 'datetime',
    },
    {
      key: 'to',
      label: 'To',
      type: 'datetime',
    },
  ];

  private readonly filters$ = new BehaviorSubject<FilterValues>({ ...EMPTY_FILTERS });
  private readonly page$ = new BehaviorSubject(1);

  readonly viewState$ = combineLatest([this.filters$, this.page$]).pipe(
    switchMap(([filters, page]) =>
      this.siemApi.getTrafficLogs(buildTrafficLogQuery(filters, page, PAGE_SIZE)).pipe(
        map(
          (result): TrafficViewState => ({
            status: 'success',
            total: result.total,
            page: result.page,
            items: result.items,
            pageStats: computeTrafficPageStats(result.items),
          }),
        ),
        catchError(() =>
          of<TrafficViewState>({
            status: 'error',
            message: 'Failed to load traffic history. Please try again.',
          }),
        ),
        startWith<TrafficViewState>({ status: 'loading' }),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  protected truncateUrl = truncateUrl;
  protected verdictCssClass = trafficVerdictCssClass;
  protected displayVerdict = normalizeTrafficVerdict;

  onFiltersApply(filters: FilterValues): void {
    this.page$.next(1);
    this.filters$.next(filters);
  }

  onPageChange(event: PageEvent): void {
    this.page$.next(event.pageIndex + 1);
  }
}
