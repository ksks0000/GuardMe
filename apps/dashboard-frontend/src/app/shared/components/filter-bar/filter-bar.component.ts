import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FilterFieldConfig, FilterValues } from '../../models/filter-bar.model';

@Component({
  selector: 'app-filter-bar',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './filter-bar.component.html',
  styleUrl: './filter-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBarComponent implements OnInit {
  readonly fields = input.required<FilterFieldConfig[]>();
  readonly initialValues = input<FilterValues>({});

  readonly filtersApply = output<FilterValues>();
  readonly filtersClear = output<void>();

  private readonly fb = inject(FormBuilder);

  form!: FormGroup;

  ngOnInit(): void {
    const controls: Record<string, string> = {};
    const initial = this.initialValues();

    for (const field of this.fields()) {
      controls[field.key] = initial[field.key] ?? '';
    }

    this.form = this.fb.nonNullable.group(controls);
  }

  apply(): void {
    this.filtersApply.emit(this.form.getRawValue() as FilterValues);
  }

  clear(): void {
    const cleared: FilterValues = {};
    for (const field of this.fields()) {
      cleared[field.key] = '';
    }
    this.form.reset(cleared);
    this.filtersClear.emit();
    this.filtersApply.emit(cleared);
  }
}
