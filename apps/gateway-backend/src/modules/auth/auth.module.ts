import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { StringValue } from 'ms';
import { PassportModule } from '@nestjs/passport';
import { authConfig } from '../../config/auth.config';
import { SessionsModule } from '../sessions/sessions.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    SessionsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: authConfig.jwtSecret(),
      signOptions: {
        expiresIn: authConfig.jwtExpiresIn() as StringValue,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
