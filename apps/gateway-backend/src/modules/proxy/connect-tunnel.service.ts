import { Injectable, Logger } from '@nestjs/common';
import { IncomingMessage } from 'node:http';
import { Socket } from 'node:net';
import { AuthenticatedUser } from '../../common/types/auth.types';
import { PolicyDecision } from './dto/policy-decision.enum';
import { ProxyPipelineService } from './proxy-pipeline.service';

@Injectable()
export class ConnectTunnelService {
  private readonly logger = new Logger(ConnectTunnelService.name);

  constructor(private readonly proxyPipeline: ProxyPipelineService) {}

  async handle(
    req: IncomingMessage,
    clientSocket: Socket,
    user: AuthenticatedUser,
  ): Promise<void> {
    const target = this.parseConnectTarget(req.url ?? '');
    if (!target) {
      this.reject(clientSocket, 400, 'Bad Request');
      return;
    }

    try {
      const decision = await this.proxyPipeline.evaluateConnect(
        target.host,
        target.port,
        user,
        req,
      );

      if (decision !== PolicyDecision.ALLOW) {
        this.reject(clientSocket, 403, 'Forbidden');
        return;
      }

      this.openTunnel(target.host, target.port, clientSocket);
    } catch (error) {
      this.logger.error(
        'CONNECT handling failed',
        error instanceof Error ? error.stack : undefined,
      );
      this.reject(clientSocket, 500, 'Proxy Error');
    }
  }

  private openTunnel(host: string, port: number, clientSocket: Socket): void {
    const serverSocket = new Socket();
    serverSocket.connect(port, host, () => {
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      serverSocket.pipe(clientSocket);
      clientSocket.pipe(serverSocket);
    });

    const closeBoth = () => {
      clientSocket.destroy();
      serverSocket.destroy();
    };

    serverSocket.on('error', closeBoth);
    clientSocket.on('error', closeBoth);
  }

  private parseConnectTarget(
    target: string,
  ): { host: string; port: number } | null {
    const [host, portValue] = target.split(':');
    if (!host) {
      return null;
    }

    const port = portValue ? Number(portValue) : 443;
    if (!Number.isFinite(port) || port <= 0 || port > 65535) {
      return null;
    }

    return { host, port };
  }

  private reject(clientSocket: Socket, status: number, message: string): void {
    clientSocket.write(`HTTP/1.1 ${status} ${message}\r\n\r\n`);
    clientSocket.destroy();
  }
}
