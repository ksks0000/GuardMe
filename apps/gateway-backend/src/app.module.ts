import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [PrismaModule, CommonModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
