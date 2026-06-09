import {
  All,
  Controller,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtSessionGuard } from '../../common/guards/jwt-session.guard';
import { AuthenticatedUser } from '../../common/types/auth.types';
import { ProxyPipelineService } from './proxy-pipeline.service';

@Controller()
export class ProxyController {
  constructor(private readonly proxyPipeline: ProxyPipelineService) {}

  @All('*')
  @UseGuards(JwtSessionGuard)
  async handleProxy(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    if (req.method.toUpperCase() === 'CONNECT') {
      throw new UnauthorizedException('CONNECT is handled by the proxy listener');
    }

    await this.proxyPipeline.handleHttp(req, res, user);
  }
}
