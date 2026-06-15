import { Injectable, OnDestroy } from '@angular/core';
import { Observable, share, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../../environments/environment';
import { SecurityEvent, SystemStatus, TrafficLog } from '../../models';
import { RealtimeApi } from '../realtime.api';
import { WEBSOCKET_CLIENT_EVENTS } from './websocket-events';

const RECONNECTION_ATTEMPTS = Infinity;
const RECONNECTION_DELAY_MS = 1000;
const RECONNECTION_DELAY_MAX_MS = 15000;

@Injectable()
export class SocketRealtimeApi extends RealtimeApi implements OnDestroy {
  private socket: Socket | null = null;

  private readonly trafficSubject = new Subject<TrafficLog>();
  private readonly securitySubject = new Subject<SecurityEvent>();
  private readonly statusSubject = new Subject<SystemStatus>();

  readonly trafficLogs$: Observable<TrafficLog> = this.trafficSubject
    .asObservable()
    .pipe(share());

  readonly securityEvents$: Observable<SecurityEvent> = this.securitySubject
    .asObservable()
    .pipe(share());

  readonly systemStatus$: Observable<SystemStatus> = this.statusSubject
    .asObservable()
    .pipe(share());

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.disconnect();

    // Socket.IO retries with exponential backoff (delay → delayMax) and
    // re-sends the session cookie via withCredentials on each reconnect.
    const socket = io(environment.wsUrl, {
      withCredentials: true,
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: RECONNECTION_ATTEMPTS,
      reconnectionDelay: RECONNECTION_DELAY_MS,
      reconnectionDelayMax: RECONNECTION_DELAY_MAX_MS,
    });

    socket.on(WEBSOCKET_CLIENT_EVENTS.TRAFFIC_LOG, (payload: TrafficLog) => {
      this.trafficSubject.next(payload);
    });

    socket.on(WEBSOCKET_CLIENT_EVENTS.SECURITY_EVENT, (payload: SecurityEvent) => {
      this.securitySubject.next(payload);
    });

    socket.on(WEBSOCKET_CLIENT_EVENTS.SYSTEM_STATUS, (payload: SystemStatus) => {
      this.statusSubject.next(payload);
    });

    this.socket = socket;
  }

  disconnect(): void {
    if (!this.socket) {
      return;
    }

    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.trafficSubject.complete();
    this.securitySubject.complete();
    this.statusSubject.complete();
  }
}
