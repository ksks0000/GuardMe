import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { CryptoService } from './crypto.service';
import { VaultUnlockGuard } from './guards/vault-unlock.guard';
import { VaultController } from './vault.controller';
import { VaultKeyCacheService } from './vault-key-cache.service';
import { VaultService } from './vault.service';

@Module({
  imports: [UsersModule],
  controllers: [VaultController],
  providers: [
    CryptoService,
    VaultKeyCacheService,
    VaultUnlockGuard,
    VaultService,
  ],
  exports: [VaultKeyCacheService, VaultService],
})
export class VaultModule {}
