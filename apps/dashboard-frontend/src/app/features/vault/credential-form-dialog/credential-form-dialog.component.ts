import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  CreateVaultCredentialInput,
  UpdateVaultCredentialInput,
  VaultCredentialSummary,
} from '../../../core/models';

export interface CredentialFormDialogData {
  mode: 'create' | 'edit';
  credential?: VaultCredentialSummary;
}

export interface CredentialFormDialogResult {
  input: CreateVaultCredentialInput | UpdateVaultCredentialInput;
}

@Component({
  selector: 'app-credential-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './credential-form-dialog.component.html',
  styleUrl: './credential-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CredentialFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<CredentialFormDialogComponent, CredentialFormDialogResult>,
  );
  readonly data = inject<CredentialFormDialogData>(MAT_DIALOG_DATA);

  readonly isEdit = this.data.mode === 'edit';

  readonly form = this.fb.nonNullable.group({
    serviceName: [
      this.data.credential?.serviceName ?? '',
      [Validators.required, Validators.maxLength(120)],
    ],
    username: [
      this.data.credential?.username ?? '',
      [Validators.required, Validators.maxLength(255)],
    ],
    password: [
      '',
      this.isEdit
        ? [Validators.maxLength(256)]
        : [Validators.required, Validators.maxLength(256)],
    ],
  });

  readonly title = this.isEdit ? 'Edit credential' : 'Add credential';

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { serviceName, username, password } = this.form.getRawValue();
    const input: CreateVaultCredentialInput | UpdateVaultCredentialInput = {
      serviceName: serviceName.trim(),
      username: username.trim(),
    };

    if (!this.isEdit || password.trim().length > 0) {
      input.password = password;
    }

    this.dialogRef.close({ input });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
