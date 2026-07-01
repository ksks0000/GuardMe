import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  passwordValidators,
} from '../../../core/validators/auth.validators';
import { AuthActions } from '../../../store/auth/auth.actions';
import {
  selectVerifyPasswordError,
  selectVerifyPasswordLoading,
} from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-reauth-dialog',
  imports: [
    ReactiveFormsModule,
    AsyncPipe,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './reauth-dialog.component.html',
  styleUrl: './reauth-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReauthDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);

  readonly loading$ = this.store.select(selectVerifyPasswordLoading);
  readonly error$ = this.store.select(selectVerifyPasswordError);

  readonly passwordMin = PASSWORD_MIN_LENGTH;
  readonly passwordMax = PASSWORD_MAX_LENGTH;

  readonly form = this.fb.nonNullable.group({
    password: ['', passwordValidators],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { password } = this.form.getRawValue();
    this.store.dispatch(AuthActions.verifyPassword({ password }));
    this.form.patchValue({ password: '' });
  }

  protected passwordError(): string | null {
    const control = this.form.controls.password;
    if (!control.touched || !control.errors) {
      return null;
    }
    if (control.errors['required']) {
      return 'Password is required.';
    }
    if (control.errors['minlength'] || control.errors['maxlength']) {
      return `Password must be ${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters.`;
    }
    return null;
  }
}
