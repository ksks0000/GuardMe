import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { Agent as HttpsAgent } from 'node:https';
import { firstValueFrom } from 'rxjs';
import { proxyConfig } from '../../config/proxy.config';
import { InspectionResult } from './dto/inspection.result';
import { resolveAllowedDestination } from './utils/dns.util';
import { sanitizeForwardRequestHeaders, sanitizeForwardResponseHeaders } from './utils/hop-by-hop-headers.util';

@Injectable()
export class ProxyForwardService {
  private readonly logger = new Logger(ProxyForwardService.name);

  constructor(private readonly httpService: HttpService) {}

  async forward(
    req: Request,
    res: Response,
    inspection: InspectionResult,
  ): Promise<void> {
    const headers = sanitizeForwardRequestHeaders(
      req.headers as Record<string, string | string[] | undefined>,
    );
    const destination = await resolveAllowedDestination(
      inspection.destinationHost,
    );
    const targetUrl = new URL(inspection.normalizedUrl);
    headers.host = targetUrl.host;
    targetUrl.hostname =
      destination.family === 6
        ? `[${destination.address}]`
        : destination.address;

    const response = await firstValueFrom(
      this.httpService.request({
        method: inspection.method,
        url: targetUrl.toString(),
        headers,
        data: this.shouldForwardBody(inspection.method) ? req : undefined,
        responseType: 'stream',
        timeout: proxyConfig.forwardTimeoutMs(),
        maxRedirects: 0,
        proxy: false,
        httpsAgent:
          targetUrl.protocol === 'https:'
            ? new HttpsAgent({ servername: inspection.destinationHost })
            : undefined,
        validateStatus: () => true,
      }),
    );

    const responseHeaders = sanitizeForwardResponseHeaders(
      response.headers as Record<string, unknown>,
    );

    res.status(response.status);
    for (const [key, value] of Object.entries(responseHeaders)) {
      res.setHeader(key, value);
    }

    const upstream = response.data as NodeJS.ReadableStream & {
      on(event: 'error', listener: (error: Error) => void): void;
    };

    upstream.on('error', (error: Error) => {
      this.logger.warn(`Upstream stream error: ${error.message}`);
      res.destroy(error);
    });

    upstream.pipe(res);
  }

  private shouldForwardBody(method: string): boolean {
    return !['GET', 'HEAD', 'CONNECT'].includes(method.toUpperCase());
  }
}
