import { Global, Module } from '@nestjs/common';
import { SecurityAuditService } from './services/security-audit.service';
import { JwtSessionGuard } from './guards/jwt-session.guard';
import { ReAuthGuard } from './guards/re-auth.guard';
import { UsersModule } from '../modules/users/users.module';

@Global()
@Module({
  imports: [UsersModule],
  providers: [SecurityAuditService, JwtSessionGuard, ReAuthGuard],
  exports: [SecurityAuditService, JwtSessionGuard, ReAuthGuard],
})
export class CommonModule {}
