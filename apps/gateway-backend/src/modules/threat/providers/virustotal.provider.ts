import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { threatConfig } from '../../../config/threat.config';
import { ThreatScanResult } from '../dto/threat-scan.result';
import { ThreatVerdict } from '../dto/threat-verdict.enum';

interface VirusTotalAnalysisStats {
  malicious?: number;
  suspicious?: number;
  harmless?: number;
  undetected?: number;
  timeout?: number;
}

interface VirusTotalUrlReportResponse {
  data?: {
    attributes?: {
      last_analysis_stats?: VirusTotalAnalysisStats;
      url?: string;
      last_final_url?: string;
      reputation?: number;
    };
  };
}

interface VirusTotalSubmitUrlResponse {
  data?: {
    id?: string;
    type?: string;
  };
}

interface VirusTotalAnalysisResponse {
  data?: {
    attributes?: {
      status?: string;
      stats?: VirusTotalAnalysisStats;
    };
  };
}

export const THREAT_RISK_SCORES: Record<ThreatVerdict, number> = {
  [ThreatVerdict.MALICIOUS]: 90,
  [ThreatVerdict.SUSPICIOUS]: 60,
  [ThreatVerdict.SAFE]: 10,
  [ThreatVerdict.UNVERIFIED]: 40,
};

@Injectable()
export class VirusTotalProvider {
  constructor(private readonly httpService: HttpService) {}

  async scanUrl(url: string): Promise<ThreatScanResult> {
    const deadline = Date.now() + threatConfig.scanTimeoutMs();

    const cachedReport = await this.tryGetCachedReport(url, deadline);
    if (cachedReport) {
      return cachedReport;
    }

    const analysisId = await this.submitUrlForAnalysis(url, deadline);
    return this.pollAnalysisResult(url, analysisId, deadline);
  }

  private async tryGetCachedReport(
    url: string,
    deadline: number,
  ): Promise<ThreatScanResult | null> {
    const endpoint = `${threatConfig.virusTotalApiBaseUrl()}/urls/${this.toUrlId(url)}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<VirusTotalUrlReportResponse>(endpoint, {
          headers: this.getHeaders(),
          timeout: this.remainingTimeout(deadline),
        }),
      );

      return this.mapReportToResult(url, response.data, {
        source: 'cached_report',
      });
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }

      throw error;
    }
  }

  private async submitUrlForAnalysis(
    url: string,
    deadline: number,
  ): Promise<string> {
    const endpoint = `${threatConfig.virusTotalApiBaseUrl()}/urls`;
    const body = new URLSearchParams({ url });

    const response = await firstValueFrom(
      this.httpService.post<VirusTotalSubmitUrlResponse>(endpoint, body, {
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: this.remainingTimeout(deadline),
      }),
    );

    const analysisId = response.data.data?.id;
    if (!analysisId) {
      throw new Error('VirusTotal did not return an analysis id');
    }

    return analysisId;
  }

  private async pollAnalysisResult(
    url: string,
    analysisId: string,
    deadline: number,
  ): Promise<ThreatScanResult> {
    const endpoint = `${threatConfig.virusTotalApiBaseUrl()}/analyses/${analysisId}`;

    while (Date.now() < deadline) {
      const response = await firstValueFrom(
        this.httpService.get<VirusTotalAnalysisResponse>(endpoint, {
          headers: this.getHeaders(),
          timeout: this.remainingTimeout(deadline),
        }),
      );

      const status = response.data.data?.attributes?.status;
      const stats = response.data.data?.attributes?.stats;

      if (status === 'completed' && stats) {
        return this.mapStatsToResult(url, stats, {
          source: 'live_analysis',
          analysisId,
        });
      }

      if (status === 'failed') {
        throw new Error('VirusTotal analysis failed');
      }

      const remaining = this.remainingTimeout(deadline);
      if (remaining <= threatConfig.minPollSleepMs()) {
        break;
      }

      await this.sleep(
        Math.min(
          threatConfig.scanPollIntervalMs(),
          Math.max(threatConfig.minPollSleepMs(), remaining),
        ),
      );
    }

    throw new AxiosError('VirusTotal analysis polling timed out', 'ECONNABORTED');
  }

  private mapReportToResult(
    scannedUrl: string,
    report: VirusTotalUrlReportResponse,
    metadata: Record<string, unknown>,
  ): ThreatScanResult {
    const stats = report.data?.attributes?.last_analysis_stats;
    if (!stats) {
      return this.buildResult(scannedUrl, ThreatVerdict.UNVERIFIED, {
        reason: 'missing_analysis_stats',
        ...metadata,
      });
    }

    return this.mapStatsToResult(scannedUrl, stats, {
      reputation: report.data?.attributes?.reputation,
      lastFinalUrl: report.data?.attributes?.last_final_url,
      ...metadata,
    });
  }

  private mapStatsToResult(
    scannedUrl: string,
    stats: VirusTotalAnalysisStats,
    metadata: Record<string, unknown>,
  ): ThreatScanResult {
    const malicious = stats.malicious ?? 0;
    const suspicious = stats.suspicious ?? 0;

    if (malicious > 0) {
      return this.buildResult(scannedUrl, ThreatVerdict.MALICIOUS, {
        lastAnalysisStats: stats,
        ...metadata,
      });
    }

    if (suspicious > 0) {
      return this.buildResult(scannedUrl, ThreatVerdict.SUSPICIOUS, {
        lastAnalysisStats: stats,
        ...metadata,
      });
    }

    return this.buildResult(scannedUrl, ThreatVerdict.SAFE, {
      lastAnalysisStats: stats,
      ...metadata,
    });
  }

  private buildResult(
    scannedUrl: string,
    verdict: ThreatVerdict,
    metadata: Record<string, unknown>,
  ): ThreatScanResult {
    return {
      verdict,
      riskScore: THREAT_RISK_SCORES[verdict],
      scannedUrl,
      provider: 'virustotal',
      metadata,
    };
  }

  private getHeaders(): Record<string, string> {
    return {
      'x-apikey': threatConfig.virusTotalApiKey(),
    };
  }

  private toUrlId(url: string): string {
    return Buffer.from(url, 'utf8').toString('base64url');
  }

  private remainingTimeout(deadline: number): number {
    return Math.max(deadline - Date.now(), 1);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isNotFoundError(error: unknown): boolean {
    return error instanceof AxiosError && error.response?.status === 404;
  }
}
