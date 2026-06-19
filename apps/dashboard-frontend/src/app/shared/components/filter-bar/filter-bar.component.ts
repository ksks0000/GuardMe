import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  combineDateAndTime,
  dateControlKey,
  splitIsoToDateTimeParts,
  timeControlKey,
} from '../../../core/utils/datetime-filter.util';
import { FilterFieldConfig, FilterValues } from '../../models/filter-bar.model';
import { FILTER_DATE_FORMATS_PROVIDER } from './filter-bar-date-formats';

export type FilterBarLayout = 'grid' | 'split' | 'compact';

@Component({
  selector: 'app-filter-bar',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatIconModule,
  ],
  providers: [provideNativeDateAdapter(), FILTER_DATE_FORMATS_PROVIDER],
  templateUrl: './filter-bar.component.html',
  styleUrl: './filter-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBarComponent implements OnInit {
  readonly fields = input.required<FilterFieldConfig[]>();
  readonly initialValues = input<FilterValues>({});
  /** `grid` = single row (default); `split` = primary row + datetime/actions row; `compact` = narrow datetime + actions */
  readonly layout = input<FilterBarLayout>('grid');

  readonly primaryFields = computed(() =>
    this.fields().filter((field) => field.type !== 'datetime'),
  );

  readonly datetimeFields = computed(() =>
    this.fields().filter((field) => field.type === 'datetime'),
  );

  readonly filtersApply = output<FilterValues>();
  readonly filtersClear = output<void>();

  private readonly fb = inject(FormBuilder);

  form!: FormGroup;

  protected readonly dateControlKey = dateControlKey;
  protected readonly timeControlKey = timeControlKey;

  ngOnInit(): void {
    const initial = this.initialValues();
    const controls: Record<string, unknown> = {};

    for (const field of this.fields()) {
      if (field.type === 'datetime') {
        const parts = splitIsoToDateTimeParts(initial[field.key] ?? '');
        controls[dateControlKey(field.key)] = this.fb.control<Date | null>(parts.date);
        controls[timeControlKey(field.key)] = this.fb.control(parts.time);
      } else {
        controls[field.key] = this.fb.control(initial[field.key] ?? '');
      }
    }

    this.form = this.fb.group(controls);
  }

  apply(): void {
    this.filtersApply.emit(this.buildFilterValues());
  }

  clear(): void {
    const cleared: FilterValues = {};

    for (const field of this.fields()) {
      if (field.type === 'datetime') {
        this.form.get(dateControlKey(field.key))?.setValue(null);
        this.form.get(timeControlKey(field.key))?.setValue('');
      } else {
        this.form.get(field.key)?.setValue('');
      }

      cleared[field.key] = '';
    }

    this.filtersClear.emit();
    this.filtersApply.emit(cleared);
  }

  private buildFilterValues(): FilterValues {
    const raw = this.form.getRawValue() as Record<string, unknown>;
    const values: FilterValues = {};

    for (const field of this.fields()) {
      if (field.type === 'datetime') {
        values[field.key] = combineDateAndTime(
          raw[dateControlKey(field.key)] as Date | null,
          raw[timeControlKey(field.key)] as string,
        );
      } else {
        values[field.key] = String(raw[field.key] ?? '');
      }
    }

    return values;
  }
}
