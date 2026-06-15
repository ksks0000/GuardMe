import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ActivityItem } from '../../../core/models';
import { truncateUrl } from '../../../core/utils/url-display.util';
import {
  normalizeTrafficVerdict,
  trafficVerdictCssClass,
} from '../../../core/utils/traffic-verdict.util';

@Component({
  selector: 'app-log-list',
  imports: [DatePipe, MatListModule, MatIconModule],
  templateUrl: './log-list.component.html',
  styleUrl: './log-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogListComponent {
  readonly items = input.required<ActivityItem[]>();
  readonly emptyMessage = input('No live activity yet. Browse via the proxy to generate traffic.');

  protected truncateUrl = truncateUrl;

  protected iconFor(item: ActivityItem): string {
    return item.kind === 'traffic' ? 'language' : 'security';
  }

  protected titleFor(item: ActivityItem): string {
    if (item.kind === 'traffic') {
      return truncateUrl(item.data.url);
    }

    return item.data.type;
  }

  protected subtitleFor(item: ActivityItem): string {
    if (item.kind === 'traffic') {
      return `${item.data.method} · risk ${item.data.riskScore}`;
    }

    return `${item.data.severity} · ${item.data.message}`;
  }

  protected trafficVerdictLabel(item: ActivityItem): string {
    return item.kind === 'traffic' ? normalizeTrafficVerdict(item.data.verdict) : '';
  }

  protected trafficVerdictClass(item: ActivityItem): string {
    return item.kind === 'traffic'
      ? `verdict verdict--${trafficVerdictCssClass(item.data.verdict)}`
      : '';
  }
}
