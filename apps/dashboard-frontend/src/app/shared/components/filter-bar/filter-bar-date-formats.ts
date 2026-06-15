import { MAT_DATE_FORMATS } from '@angular/material/core';

/** European-style date display for filter pickers (no AM/PM). */
export const FILTER_DATE_FORMATS = {
  parse: {
    dateInput: 'dd.MM.yyyy',
  },
  display: {
    dateInput: 'dd.MM.yyyy',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'dd.MM.yyyy',
    monthYearA11yLabel: 'MMMM yyyy',
  },
};

export const FILTER_DATE_FORMATS_PROVIDER = {
  provide: MAT_DATE_FORMATS,
  useValue: FILTER_DATE_FORMATS,
};
