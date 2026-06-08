import { Global, Module } from '@nestjs/common';
import { JwtSessionGuard } from './guards/jwt-session.guard';
import { ReAuthGuard } from './guards/re-auth.guard';
import { UsersModule } from '../modules/users/users.module';

@Global()
@Module({
  imports: [UsersModule],
  providers: [JwtSessionGuard, ReAuthGuard],
  exports: [JwtSessionGuard, ReAuthGuard],
})
export class CommonModule {}
