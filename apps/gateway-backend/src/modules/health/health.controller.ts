import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { SystemStatusPayload } from './dto/system-status.payload';
import { SystemStatusService } from './system-status.service';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly systemStatusService: SystemStatusService) {}

  @Get()
  getHealth(): Promise<SystemStatusPayload> {
    return this.systemStatusService.getStatus();
  }
}
