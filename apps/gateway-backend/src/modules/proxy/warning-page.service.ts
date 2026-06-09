import { Injectable } from '@nestjs/common';
import { WarningPageContext } from './dto/warning-page.context';
import { loadTemplate, renderTemplate } from './utils/template-render.util';

@Injectable()
export class WarningPageService {
  private readonly template = loadTemplate('templates/warning.html');

  render(context: WarningPageContext): string {
    return renderTemplate(this.template, {
      url: context.url,
      reason: context.reason,
      threatSummary: context.threatSummary,
      riskScore: String(context.riskScore),
      timestamp: context.timestamp.toISOString(),
      proceedUrl: context.proceedUrl,
    });
  }

  buildContext(input: {
    url: string;
    reason: string;
    threatSummary: string;
    riskScore: number;
    proceedUrl: string;
    timestamp?: Date;
  }): WarningPageContext {
    return {
      url: input.url,
      reason: input.reason,
      threatSummary: input.threatSummary,
      riskScore: input.riskScore,
      timestamp: input.timestamp ?? new Date(),
      proceedUrl: input.proceedUrl,
    };
  }
}
