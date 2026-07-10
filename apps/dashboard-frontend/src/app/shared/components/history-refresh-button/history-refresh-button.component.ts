import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-history-refresh-button',
  imports: [MatIconModule],
  templateUrl: './history-refresh-button.component.html',
  styleUrl: './history-refresh-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryRefreshButtonComponent {
  readonly disabled = input(false);
  readonly refresh = output<void>();
}
