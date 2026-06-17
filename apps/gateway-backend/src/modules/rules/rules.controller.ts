import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtSessionGuard } from '../../common/guards/jwt-session.guard';
import { ReAuthGuard } from '../../common/guards/re-auth.guard';
import { AuthenticatedUser } from '../../common/types/auth.types';
import { CreateFirewallRuleDto } from './dto/create-firewall-rule.dto';
import { UpdateFirewallRuleDto } from './dto/update-firewall-rule.dto';
import { RulesService } from './rules.service';

@Controller('rules')
@UseGuards(JwtSessionGuard)
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.rulesService.listForUser(user.userId);
  }

  @Post()
  @UseGuards(ReAuthGuard)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFirewallRuleDto,
  ) {
    return this.rulesService.createForUser(user.userId, dto);
  }

  @Patch(':id')
  @UseGuards(ReAuthGuard)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFirewallRuleDto,
  ) {
    return this.rulesService.updateForUser(user.userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(ReAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.rulesService.deleteForUser(user.userId, id);
  }
}
