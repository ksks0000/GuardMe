import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { combineLatest, filter, map, take } from 'rxjs';
import {
  CreateVaultCredentialInput,
  UpdateVaultCredentialInput,
  VaultCredentialSummary,
} from '../../core/models';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  passwordValidators,
} from '../../core/validators/auth.validators';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { VaultActions } from '../../store/vault/vault.actions';
import {
  selectAllCredentials,
  selectVaultError,
  selectVaultLoading,
  selectVaultLocked,
  selectVaultSaving,
  selectVaultStatusLoaded,
  selectVaultUnlockError,
  selectVaultUnlocking,
} from '../../store/vault/vault.selectors';
import {
  CredentialFormDialogComponent,
  CredentialFormDialogData,
  CredentialFormDialogResult,
} from './credential-form-dialog/credential-form-dialog.component';
import {
  ViewPasswordDialogComponent,
  ViewPasswordDialogData,
} from './view-password-dialog/view-password-dialog.component';

@Component({
  selector: 'app-vault',
  imports: [
    AsyncPipe,
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    EmptyStateComponent,
  ],
  templateUrl: './vault.component.html',
  styleUrl: './vault.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VaultComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly credentials$ = this.store.select(selectAllCredentials);
  readonly locked$ = this.store.select(selectVaultLocked);
  readonly loading$ = this.store.select(selectVaultLoading);
  readonly saving$ = this.store.select(selectVaultSaving);
  readonly unlocking$ = this.store.select(selectVaultUnlocking);
  readonly error$ = this.store.select(selectVaultError);
  readonly unlockError$ = this.store.select(selectVaultUnlockError);

  readonly ready$ = combineLatest([
    this.store.select(selectVaultStatusLoaded),
    this.loading$,
  ]).pipe(map(([loaded, loading]) => loaded && !loading));

  readonly displayedColumns = ['serviceName', 'username', 'updatedAt', 'actions'];

  readonly unlockForm = this.fb.nonNullable.group({
    password: ['', passwordValidators],
  });

  readonly passwordMin = PASSWORD_MIN_LENGTH;
  readonly passwordMax = PASSWORD_MAX_LENGTH;

  ngOnInit(): void {
    this.store.dispatch(VaultActions.loadStatus());
  }

  submitUnlock(): void {
    if (this.unlockForm.invalid) {
      this.unlockForm.markAllAsTouched();
      return;
    }

    const { password } = this.unlockForm.getRawValue();
    this.store.dispatch(VaultActions.unlockVault({ password }));
    this.unlockForm.patchValue({ password: '' });
  }

  lockVault(): void {
    this.store.dispatch(VaultActions.lockVault());
  }

  openCreateDialog(): void {
    this.openCredentialDialog({ mode: 'create' });
  }

  openEditDialog(credential: VaultCredentialSummary): void {
    this.openCredentialDialog({ mode: 'edit', credential });
  }

  viewPassword(credential: VaultCredentialSummary): void {
    this.store.dispatch(VaultActions.revealCredential({ id: credential.id }));

    this.actions$
      .pipe(
        ofType(VaultActions.revealCredentialSuccess),
        filter((action) => action.id === credential.id),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((action) => {
        const dialogRef = this.dialog.open<ViewPasswordDialogComponent, ViewPasswordDialogData>(
          ViewPasswordDialogComponent,
          {
            width: '26rem',
            data: {
              serviceName: credential.serviceName,
              username: credential.username,
              password: action.password,
            },
          },
        );

        dialogRef.afterClosed().subscribe(() => {
          this.store.dispatch(VaultActions.clearRevealedPassword({ id: credential.id }));
        });
      });
  }

  deleteCredential(credential: VaultCredentialSummary): void {
    const confirmed = window.confirm(
      `Delete credential for "${credential.serviceName}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    this.store.dispatch(VaultActions.deleteCredential({ id: credential.id }));
  }

  dismissError(): void {
    this.store.dispatch(VaultActions.clearError());
  }

  dismissUnlockError(): void {
    this.store.dispatch(VaultActions.clearUnlockError());
  }

  private openCredentialDialog(data: CredentialFormDialogData): void {
    const dialogRef = this.dialog.open<
      CredentialFormDialogComponent,
      CredentialFormDialogData,
      CredentialFormDialogResult
    >(CredentialFormDialogComponent, {
      width: '28rem',
      disableClose: true,
      data,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      if (data.mode === 'create') {
        this.store.dispatch(
          VaultActions.createCredential({
            input: result.input as CreateVaultCredentialInput,
          }),
        );
        return;
      }

      if (data.credential) {
        this.store.dispatch(
          VaultActions.updateCredential({
            id: data.credential.id,
            input: result.input as UpdateVaultCredentialInput,
          }),
        );
      }
    });
  }
}
