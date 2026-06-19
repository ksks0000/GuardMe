import 'dotenv/config';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import { IncomingMessage, Server, createServer } from 'node:http';
import { Socket } from 'node:net';
import { AppModule } from './app.module';
import { corsConfig } from './config/cors.config';
import { proxyConfig } from './config/proxy.config';
import { ConnectTunnelService } from './modules/proxy/connect-tunnel.service';
import { ProxyAuthService } from './modules/proxy/proxy-auth.service';
import { ProxyPipelineService } from './modules/proxy/proxy-pipeline.service';
import { ProxyRealmService } from './modules/proxy/proxy-realm.service';

const logger = new Logger('Bootstrap');

function respondProxyAuthRequired(res: Response, realm: string): void {
  res
    .status(407)
    .setHeader('Proxy-Authenticate', `Basic realm="${realm}"`)
    .setHeader('Content-Type', 'text/html; charset=utf-8')
    .setHeader('X-Content-Type-Options', 'nosniff')
    .send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>GuardMe Proxy — Login Required</title></head>
<body style="font-family:system-ui;background:#0f1419;color:#e7ecf3;padding:2rem;">
  <h1>Proxy authentication required</h1>
  <p>Your browser should prompt for a username and password.</p>
  <p>Sign in at the dashboard first, then enter the <strong>same GuardMe credentials</strong> when prompted.</p>
  <p>After sign-out or switching users, your browser may prompt again for proxy credentials.</p>
</body>
</html>`);
}

function createProxyServer(app: INestApplication): Server {
  const proxyAuth = app.get(ProxyAuthService);
  const proxyPipeline = app.get(ProxyPipelineService);
  const connectTunnel = app.get(ConnectTunnelService);
  const proxyRealm = app.get(ProxyRealmService);

  const proxyApp = express();
  proxyApp.disable('x-powered-by');

  proxyApp.use((req: Request, res: Response) => {
    void (async () => {
      let user;
      try {
        user = await proxyAuth.authenticate(req);
      } catch {
        respondProxyAuthRequired(res, proxyRealm.getRealm());
        return;
      }

      await proxyPipeline.handleHttp(req, res, user);
    })();
  });

  const server = createServer(proxyApp);

  server.on('connect', (req: IncomingMessage, clientSocket: Socket) => {
    void (async () => {
      try {
        const user = await proxyAuth.authenticate(req);
        await connectTunnel.handle(req, clientSocket, user);
      } catch {
        const realm = proxyRealm.getRealm();
        clientSocket.write(
          'HTTP/1.1 407 Proxy Authentication Required\r\n' +
            `Proxy-Authenticate: Basic realm="${realm}"\r\n\r\n`,
        );
        clientSocket.destroy();
      }
    })();
  });

  return server;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors({
    origin: corsConfig.allowedOrigins(),
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

  const apiPort = Number(process.env.PORT ?? 3000);
  await app.listen(apiPort);
  logger.log(`GuardMe API listening on port ${apiPort}`);

  const proxyServer = createProxyServer(app);
  const proxyPort = proxyConfig.port();
  await new Promise<void>((resolve, reject) => {
    proxyServer.once('error', reject);
    proxyServer.listen(proxyPort, resolve);
  });
  logger.log(`GuardMe proxy listening on port ${proxyPort}`);
}

bootstrap().catch((error: unknown) => {
  logger.error(
    'Failed to start GuardMe gateway',
    error instanceof Error ? error.stack : String(error),
  );
  process.exit(1);
});
