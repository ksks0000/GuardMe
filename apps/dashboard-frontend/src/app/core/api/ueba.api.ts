import { Observable } from 'rxjs';
import { BehaviorBaselinePayload, UebaAnomaliesPayload, UebaAnomaliesQuery } from '../models/ueba.model';

export abstract class UebaApi {
  abstract getBaseline(): Observable<BehaviorBaselinePayload>;

  abstract getAnomalies(query: UebaAnomaliesQuery): Observable<UebaAnomaliesPayload>;
}
