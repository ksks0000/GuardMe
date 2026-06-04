import { Injectable, Logger } from '@nestjs/common';

export type SecurityEventType =
  | 'AUTH_FAILURE'
  | 'SESSION_REVOKED'
  | 'FINGERPRINT_MISMATCH'
  | 'REAUTH_REQUIRED';

export interface SecurityAuditEvent {
  type: SecurityEventType;
  message: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger(SecurityAuditService.name);

  log(event: SecurityAuditEvent): void {
    this.logger.warn(
      `[${event.type}] ${event.message}`,
      event.metadata ? JSON.stringify(event.metadata) : '',
    );
  }
}
