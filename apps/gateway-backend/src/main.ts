import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { IncomingMessage } from 'node:http';
import { Socket } from 'node:net';
import { AppModule } from './app.module';
import { proxyConfig } from './config/proxy.config';
import { websocketConfig } from './config/websocket.config';
import { ProxyUnauthorizedFilter } from './modules/proxy/filters/proxy-unauthorized.filter';
import { ConnectTunnelService } from './modules/proxy/connect-tunnel.service';
import { ProxyAppModule } from './modules/proxy/proxy-app.module';
import { ProxyAuthService } from './modules/proxy/proxy-auth.service';

async function bootstrapApi(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: websocketConfig.corsOrigins(),
    credentials: true,
  });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`GuardMe API listening on port ${port}`);
}

async function bootstrapProxy(): Promise<void> {
  const app = await NestFactory.create(ProxyAppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.use(cookieParser());
  app.useGlobalFilters(new ProxyUnauthorizedFilter());

  const proxyAuth = app.get(ProxyAuthService);
  const connectTunnel = app.get(ConnectTunnelService);
  const server = app.getHttpServer();

  server.on(
    'connect',
    (req: IncomingMessage, clientSocket: Socket, _head: Buffer) => {
      void (async () => {
        try {
          const user = await proxyAuth.authenticate(req);
          await connectTunnel.handle(req, clientSocket, user);
        } catch {
          clientSocket.write('HTTP/1.1 407 Proxy Authentication Required\r\n\r\n');
          clientSocket.destroy();
        }
      })();
    },
  );

  const port = proxyConfig.port();
  await app.listen(port);
  console.log(`GuardMe proxy listening on port ${port}`);
}

async function bootstrap(): Promise<void> {
  await Promise.all([bootstrapApi(), bootstrapProxy()]);
}

bootstrap();
