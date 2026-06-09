import { Injectable } from '@nestjs/common';
import { BlockPageContext } from './dto/block-page.context';
import { loadTemplate, renderTemplate } from './utils/template-render.util';

@Injectable()
export class BlockPageService {
  private readonly template = loadTemplate('templates/block.html');

  render(context: BlockPageContext): string {
    return renderTemplate(this.template, {
      url: context.url,
      reason: context.reason,
      riskScore: String(context.riskScore),
      timestamp: context.timestamp.toISOString(),
    });
  }
}
