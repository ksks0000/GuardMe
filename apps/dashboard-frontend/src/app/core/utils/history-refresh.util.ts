import { Observable, startWith, Subject } from 'rxjs';

export class HistoryRefreshTrigger {
  private readonly refresh$ = new Subject<void>();

  readonly changes$: Observable<void> = this.refresh$.pipe(startWith(void 0));

  refresh(): void {
    this.refresh$.next();
  }
}
