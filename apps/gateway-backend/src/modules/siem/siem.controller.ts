import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtSessionGuard } from '../../common/guards/jwt-session.guard';
import { AuthenticatedUser } from '../../common/types/auth.types';
import { SecurityEventsQueryDto } from './dto/security-events-query.dto';
import { TrafficLogsQueryDto } from './dto/traffic-logs-query.dto';
import { SiemService } from './siem.service';

@Controller('siem')
@UseGuards(JwtSessionGuard)
export class SiemController {
  constructor(private readonly siemService: SiemService) {}

  @Get('traffic-logs')
  getTrafficLogs(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: TrafficLogsQueryDto,
  ) {
    return this.siemService.findTrafficLogsForUser(user.userId, query);
  }

  @Get('security-events')
  getSecurityEvents(@Query() query: SecurityEventsQueryDto) {
    return this.siemService.findSecurityEvents(query);
  }
}
