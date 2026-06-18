import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtSessionGuard } from '../../common/guards/jwt-session.guard';
import { AuthenticatedUser } from '../../common/types/auth.types';
import { AnalyticsSummaryQueryDto } from './dto/analytics-summary-query.dto';
import { SecurityEventsQueryDto } from './dto/security-events-query.dto';
import { TrafficLogsQueryDto } from './dto/traffic-logs-query.dto';
import { SiemAnalyticsService } from './siem-analytics.service';
import { SiemService } from './siem.service';

@Controller('siem')
@UseGuards(JwtSessionGuard)
export class SiemController {
  constructor(
    private readonly siemService: SiemService,
    private readonly siemAnalyticsService: SiemAnalyticsService,
  ) {}

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

  @Get('analytics/summary')
  getAnalyticsSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AnalyticsSummaryQueryDto,
  ) {
    return this.siemAnalyticsService.getSummaryForUser(
      user.userId,
      user.username,
      query,
    );
  }
}
