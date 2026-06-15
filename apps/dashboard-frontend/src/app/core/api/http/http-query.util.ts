import { HttpParams } from '@angular/common/http';

type QueryRecord = Record<string, string | number | boolean | undefined | null>;

export function toHttpParams(query: QueryRecord): HttpParams {
  let params = new HttpParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    params = params.set(key, String(value));
  }

  return params;
}
