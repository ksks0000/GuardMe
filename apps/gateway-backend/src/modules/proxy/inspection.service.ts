import { BadRequestException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { ThreatVerdict } from '../threat/dto/threat-verdict.enum';
import { InspectionResult } from './dto/inspection.result';
import { FileScanResult } from './dto/file-scan.result';
import {
  defaultPortForScheme,
  extractBypassToken,
  isBlockedDestinationHost,
  stripBypassParam,
} from './utils/url.util';

const HIGH_RISK_EXTENSIONS = new Set([
  '.exe',
  '.msi',
  '.bat',
  '.cmd',
  '.scr',
  '.pif',
  '.vbs',
  '.js',
  '.jar',
  '.dll',
  '.ps1',
  '.hta',
  '.com',
]);

const SUSPICIOUS_EXTENSIONS = new Set(['.zip', '.rar', '.7z', '.iso']);

@Injectable()
export class InspectionService {
  inspect(req: Request): InspectionResult {
    const method = req.method.toUpperCase();
    const absoluteUrl = this.resolveAbsoluteUrl(req);
    const parsed = new URL(absoluteUrl);
    const scheme = parsed.protocol.replace(':', '') as 'http' | 'https';

    if (scheme !== 'http' && scheme !== 'https') {
      throw new BadRequestException('Only http and https URLs are allowed');
    }

    if (isBlockedDestinationHost(parsed.hostname)) {
      throw new BadRequestException('Destination host is not allowed');
    }

    const bypassToken = extractBypassToken(absoluteUrl);
    const normalizedUrl = stripBypassParam(absoluteUrl);
    const fileName = this.extractFileName(parsed);
    const isFileDownload = fileName !== null;

    return {
      method,
      normalizedUrl,
      destinationHost: parsed.hostname,
      destinationPort: parsed.port
        ? Number(parsed.port)
        : defaultPortForScheme(scheme),
      destinationScheme: scheme,
      isFileDownload,
      fileName,
      bypassToken,
    };
  }

  simulateFileScan(inspection: InspectionResult): FileScanResult | undefined {
    if (!inspection.isFileDownload || !inspection.fileName) {
      return undefined;
    }

    const lowerName = inspection.fileName.toLowerCase();
    const extension = this.extractExtension(lowerName);

    if (HIGH_RISK_EXTENSIONS.has(extension)) {
      return {
        fileName: inspection.fileName,
        verdict: ThreatVerdict.MALICIOUS,
        riskScore: 85,
        reason: `High-risk file extension (${extension})`,
      };
    }

    if (SUSPICIOUS_EXTENSIONS.has(extension)) {
      return {
        fileName: inspection.fileName,
        verdict: ThreatVerdict.SUSPICIOUS,
        riskScore: 55,
        reason: `Archive or disk image extension (${extension})`,
      };
    }

    return {
      fileName: inspection.fileName,
      verdict: ThreatVerdict.SAFE,
      riskScore: 15,
      reason: 'No high-risk file extension detected',
    };
  }

  buildConnectInspection(host: string, port: number): InspectionResult {
    if (isBlockedDestinationHost(host)) {
      throw new BadRequestException('Destination host is not allowed');
    }

    const normalizedUrl = `https://${host}:${port}/`;

    return {
      method: 'CONNECT',
      normalizedUrl,
      destinationHost: host,
      destinationPort: port,
      destinationScheme: 'https',
      isFileDownload: false,
      fileName: null,
      bypassToken: null,
    };
  }

  private resolveAbsoluteUrl(req: Request): string {
    if (/^https?:\/\//i.test(req.url)) {
      return req.url;
    }

    const host = req.headers.host;
    if (!host) {
      throw new BadRequestException('Missing host header');
    }

    return `http://${host}${req.url}`;
  }

  private extractFileName(parsed: URL): string | null {
    const pathname = parsed.pathname;
    const lastSegment = pathname.split('/').pop() ?? '';
    if (!lastSegment || !lastSegment.includes('.')) {
      return null;
    }

    return lastSegment;
  }

  private extractExtension(fileName: string): string {
    const index = fileName.lastIndexOf('.');
    return index >= 0 ? fileName.slice(index) : '';
  }
}
