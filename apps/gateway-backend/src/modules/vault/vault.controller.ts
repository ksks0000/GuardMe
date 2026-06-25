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
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtSessionGuard } from '../../common/guards/jwt-session.guard';
import { ReAuthGuard } from '../../common/guards/re-auth.guard';
import { AuthenticatedUser } from '../../common/types/auth.types';
import { throttleConfig } from '../../config/throttle.config';
import { CreateVaultCredentialDto } from './dto/create-vault-credential.dto';
import { UnlockVaultDto } from './dto/unlock-vault.dto';
import { UpdateVaultCredentialDto } from './dto/update-vault-credential.dto';
import { VaultUnlockGuard } from './guards/vault-unlock.guard';
import { VaultService } from './vault.service';

@Controller('vault')
@UseGuards(JwtSessionGuard)
export class VaultController {
  constructor(private readonly vaultService: VaultService) {}

  @Get('status')
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.vaultService.getStatus(user.userId);
  }

  @Post('unlock')
  @Throttle({
    default: { ttl: throttleConfig.ttlMs(), limit: throttleConfig.authLimit() },
  })
  @HttpCode(HttpStatus.OK)
  unlock(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UnlockVaultDto,
    @Req() req: Request,
  ) {
    return this.vaultService.unlock(user, dto.password, req);
  }

  @Post('lock')
  @HttpCode(HttpStatus.OK)
  lock(@CurrentUser() user: AuthenticatedUser) {
    return this.vaultService.lock(user.userId);
  }

  @Get('credentials')
  @UseGuards(VaultUnlockGuard)
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.vaultService.listCredentials(user.userId);
  }

  @Get('credentials/:id')
  @UseGuards(VaultUnlockGuard, ReAuthGuard)
  getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vaultService.getCredential(user.userId, id);
  }

  @Post('credentials')
  @UseGuards(VaultUnlockGuard, ReAuthGuard)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateVaultCredentialDto,
  ) {
    return this.vaultService.createCredential(user.userId, dto);
  }

  @Patch('credentials/:id')
  @UseGuards(VaultUnlockGuard, ReAuthGuard)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVaultCredentialDto,
  ) {
    return this.vaultService.updateCredential(user.userId, id, dto);
  }

  @Delete('credentials/:id')
  @UseGuards(ReAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.vaultService.deleteCredential(user.userId, id);
  }
}
