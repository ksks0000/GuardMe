import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { HealthState } from '../../../core/models';

@Component({
  selector: 'app-status-badge',
  imports: [MatChipsModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  readonly label = input.required<string>();
  readonly state = input.required<HealthState | null>();

  protected readonly displayState = computed(() => this.state() ?? 'unknown');

  protected readonly chipClass = computed(() => {
    const state = this.state();
    if (state === 'ok') {
      return 'chip-ok';
    }
    if (state === 'degraded') {
      return 'chip-degraded';
    }
    return 'chip-unknown';
  });
}
