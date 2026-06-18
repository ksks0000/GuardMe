import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ViewPasswordDialogData {
  serviceName: string;
  username: string;
  password: string;
}

@Component({
  selector: 'app-view-password-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './view-password-dialog.component.html',
  styleUrl: './view-password-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewPasswordDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ViewPasswordDialogComponent>);
  readonly data = inject<ViewPasswordDialogData>(MAT_DIALOG_DATA);

  readonly passwordVisible = signal(false);
  readonly copied = signal(false);

  maskedPassword(): string {
    const length = this.data.password.length;
    if (length === 0) {
      return '—';
    }

    return '*'.repeat(Math.min(length, 32));
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  async copyPassword(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.data.password);
      this.copied.set(true);
    } catch {
      this.copied.set(false);
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
