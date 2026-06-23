import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { SessionsService } from './sessions.service';

@Module({
  imports: [UsersModule],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
