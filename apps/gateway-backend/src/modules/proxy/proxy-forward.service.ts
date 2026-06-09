import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { proxyConfig } from '../../config/proxy.config';
import { InspectionResult } from './dto/inspection.result';
import {
  sanitizeForwardRequestHeaders,
  sanitizeForwardResponseHeaders,
} from './utils/hop-by-hop-headers.util';

@Injectable()
export class ProxyForwardService {
  constructor(private readonly httpService: HttpService) {}

  async forward(
    req: Request,
    res: Response,
    inspection: InspectionResult,
  ): Promise<void> {
    const headers = sanitizeForwardRequestHeaders(
      req.headers as Record<string, string | string[] | undefined>,
    );

    const response = await firstValueFrom(
      this.httpService.request({
        method: inspection.method,
        url: inspection.normalizedUrl,
        headers,
        data: this.shouldForwardBody(inspection.method) ? req : undefined,
        responseType: 'stream',
        timeout: proxyConfig.forwardTimeoutMs(),
        maxRedirects: 5,
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

    response.data.pipe(res);
  }

  private shouldForwardBody(method: string): boolean {
    return !['GET', 'HEAD', 'CONNECT'].includes(method.toUpperCase());
  }
}
