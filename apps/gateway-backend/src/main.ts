import 'dotenv/config';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import { IncomingMessage, Server, createServer } from 'node:http';
import { Socket } from 'node:net';
import { AppModule } from './app.module';
import { proxyConfig } from './config/proxy.config';
import { websocketConfig } from './config/websocket.config';
import { ConnectTunnelService } from './modules/proxy/connect-tunnel.service';
import { ProxyAuthService } from './modules/proxy/proxy-auth.service';
import { ProxyPipelineService } from './modules/proxy/proxy-pipeline.service';

const logger = new Logger('Bootstrap');

function respondProxyAuthRequired(res: Response): void {
  res
    .status(407)
    .setHeader('Proxy-Authenticate', 'Cookie realm="GuardMe"')
    .setHeader('Content-Type', 'text/html; charset=utf-8')
    .setHeader('X-Content-Type-Options', 'nosniff')
    .send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>GuardMe Proxy — Login Required</title></head>
<body style="font-family:system-ui;background:#0f1419;color:#e7ecf3;padding:2rem;">
  <h1>Proxy authentication required</h1>
  <p>Log in to GuardMe on the management API port, then retry browsing through the proxy.</p>
</body>
</html>`);
}

// The proxy listener is a plain Express server that reuses services from the
// single Nest DI container, so SIEM events emitted by proxied traffic reach
// the WebSocket gateway running in the same process.
function createProxyServer(app: INestApplication): Server {
  const proxyAuth = app.get(ProxyAuthService);
  const proxyPipeline = app.get(ProxyPipelineService);
  const connectTunnel = app.get(ConnectTunnelService);

  const proxyApp = express();
  proxyApp.disable('x-powered-by');

  proxyApp.use((req: Request, res: Response) => {
    void (async () => {
      let user;
      try {
        user = await proxyAuth.authenticate(req);
      } catch {
        respondProxyAuthRequired(res);
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
        clientSocket.write('HTTP/1.1 407 Proxy Authentication Required\r\n\r\n');
        clientSocket.destroy();
      }
    })();
  });

  return server;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  // Helmet only on the management API; the proxy listener sets its own
  // headers and must not alter forwarded upstream responses.
  app.use(helmet());
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
