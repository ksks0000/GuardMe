import { Injectable, Logger } from '@nestjs/common';
import { IncomingMessage } from 'node:http';
import { Socket } from 'node:net';
import { AuthenticatedUser } from '../../common/types/auth.types';
import { PolicyDecision } from './dto/policy-decision.enum';
import { parseConnectTarget } from './utils/connect-target.util';
import { ProxyPipelineService } from './proxy-pipeline.service';
import { BlockedDestinationError, resolveAllowedDestination } from './utils/dns.util';

@Injectable()
export class ConnectTunnelService {
  private readonly logger = new Logger(ConnectTunnelService.name);

  constructor(private readonly proxyPipeline: ProxyPipelineService) {}

  async handle(
    req: IncomingMessage,
    clientSocket: Socket,
    user: AuthenticatedUser,
  ): Promise<void> {
    const target = parseConnectTarget(req.url ?? '');
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

      const destination = await resolveAllowedDestination(target.host);
      this.openTunnel(destination.address, target.port, clientSocket);
    } catch (error) {
      if (error instanceof BlockedDestinationError) {
        this.reject(clientSocket, 403, 'Forbidden');
        return;
      }

      this.logger.error(
        'CONNECT handling failed',
        error instanceof Error ? error.stack : undefined,
      );
      this.reject(clientSocket, 500, 'Proxy Error');
    }
  }

  private openTunnel(address: string, port: number, clientSocket: Socket): void {
    const serverSocket = new Socket();
    serverSocket.connect(port, address, () => {
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

  private reject(clientSocket: Socket, status: number, message: string): void {
    clientSocket.write(`HTTP/1.1 ${status} ${message}\r\n\r\n`);
    clientSocket.destroy();
  }
}
