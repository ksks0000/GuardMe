import { AsyncPipe, DatePipe, LowerCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  map,
  of,
  shareReplay,
  skip,
  startWith,
  switchMap,
} from 'rxjs';
import { SiemApi } from '../../core/api/siem.api';
import { SecurityEvent, SIEM_EVENT_SEVERITIES, SIEM_EVENT_TYPES } from '../../core/models';
import { buildSecurityEventQuery } from '../../core/utils/history-query.util';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { FilterBarComponent } from '../../shared/components/filter-bar/filter-bar.component';
import { FilterFieldConfig, FilterValues } from '../../shared/models/filter-bar.model';

const PAGE_SIZE = 15;

const HIDDEN_METADATA_KEYS = new Set(['userId', 'ruleId']);

function filtersFromRoute(params: ParamMap): FilterValues {
  return {
    type: params.get('type') ?? '',
    severity: params.get('severity') ?? '',
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
  };
}

type SecurityViewState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'success';
      total: number;
      page: number;
      items: SecurityEvent[];
    };

@Component({
  selector: 'app-security',
  imports: [
    AsyncPipe,
    DatePipe,
    LowerCasePipe,
    MatExpansionModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    FilterBarComponent,
    EmptyStateComponent,
  ],
  templateUrl: './security.component.html',
  styleUrl: './security.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecurityComponent {
  private readonly siemApi = inject(SiemApi);
  private readonly route = inject(ActivatedRoute);

  readonly pageSize = PAGE_SIZE;

  readonly routeFilters = signal<FilterValues>(filtersFromRoute(this.route.snapshot.queryParamMap));
  readonly filterBarRevision = signal(0);

  readonly filterFields: FilterFieldConfig[] = [
    {
      key: 'type',
      label: 'Event type',
      type: 'select',
      options: [
        { label: 'All', value: '' },
        ...Object.values(SIEM_EVENT_TYPES).map((type) => ({ label: type, value: type })),
      ],
    },
    {
      key: 'severity',
      label: 'Severity',
      type: 'select',
      options: [
        { label: 'All', value: '' },
        ...Object.values(SIEM_EVENT_SEVERITIES).map((severity) => ({
          label: severity,
          value: severity,
        })),
      ],
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

  private readonly filters$ = new BehaviorSubject<FilterValues>(
    filtersFromRoute(this.route.snapshot.queryParamMap),
  );
  private readonly page$ = new BehaviorSubject(1);

  constructor() {
    this.route.queryParamMap
      .pipe(skip(1), takeUntilDestroyed())
      .subscribe((params) => this.applyRouteFilters(params));
  }

  readonly viewState$ = combineLatest([this.filters$, this.page$]).pipe(
    switchMap(([filters, page]) =>
      this.siemApi.getSecurityEvents(buildSecurityEventQuery(filters, page, PAGE_SIZE)).pipe(
        map(
          (result): SecurityViewState => ({
            status: 'success',
            total: result.total,
            page: result.page,
            items: result.items,
          }),
        ),
        catchError(() =>
          of<SecurityViewState>({
            status: 'error',
            message: 'Failed to load security events. Please try again.',
          }),
        ),
        startWith<SecurityViewState>({ status: 'loading' }),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  onFiltersApply(filters: FilterValues): void {
    this.page$.next(1);
    this.filters$.next(filters);
  }

  onPageChange(event: PageEvent): void {
    this.page$.next(event.pageIndex + 1);
  }

  private applyRouteFilters(params: ParamMap): void {
    const filters = filtersFromRoute(params);
    this.routeFilters.set(filters);
    this.page$.next(1);
    this.filters$.next(filters);
    this.filterBarRevision.update((revision) => revision + 1);
  }

  metadataEntries(event: SecurityEvent): Array<{ key: string; value: string }> {
    if (!event.metadata) {
      return [];
    }

    return Object.entries(event.metadata)
      .filter(([key]) => !HIDDEN_METADATA_KEYS.has(key))
      .map(([key, value]) => ({
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value),
      }));
  }
}
