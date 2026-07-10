import { Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtSessionGuard } from '../../common/guards/jwt-session.guard';
import { AuthenticatedUser } from '../../common/types/auth.types';
import { throttleConfig } from '../../config/throttle.config';
import { BaselineService } from './baseline.service';
import { UebaAnomaliesQueryDto } from './dto/ueba-anomalies-query.dto';
import { UebaAnomaliesPayload } from './dto/ueba-anomalies.payload';
import { UebaAnalyticsService } from './ueba-analytics.service';

@Controller('ueba')
@UseGuards(JwtSessionGuard)
export class UebaController {
  constructor(
    private readonly baselineService: BaselineService,
    private readonly uebaAnalyticsService: UebaAnalyticsService,
  ) {}

  @Get('baseline')
  getBaseline(@CurrentUser() user: AuthenticatedUser) {
    return this.baselineService.getForUser(user.userId);
  }

  @Post('baseline/refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: { ttl: throttleConfig.ttlMs(), limit: throttleConfig.authLimit() },
  })
  refreshBaseline(@CurrentUser() user: AuthenticatedUser) {
    return this.baselineService.refreshForUser(user.userId);
  }

  @Get('anomalies')
  getAnomalies(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: UebaAnomaliesQueryDto,
  ): Promise<UebaAnomaliesPayload> {
    return this.uebaAnalyticsService.getAnomaliesForUser(user.userId, query);
  }
}
