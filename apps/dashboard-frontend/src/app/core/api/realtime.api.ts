import { Observable } from 'rxjs';
import { SecurityEvent, SessionEvent, SystemStatus, TrafficLog } from '../models';

export abstract class RealtimeApi {
  abstract readonly trafficLogs$: Observable<TrafficLog>;
  abstract readonly securityEvents$: Observable<SecurityEvent>;
  abstract readonly systemStatus$: Observable<SystemStatus>;
  abstract readonly sessionEvents$: Observable<SessionEvent>;
  abstract connect(): void;
  abstract disconnect(): void;
}
