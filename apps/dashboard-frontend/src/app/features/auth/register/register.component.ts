import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  normalizeUsername,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  passwordMatchValidator,
  passwordValidators,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  usernameValidators,
} from '../../../core/validators/auth.validators';
import { AuthActions } from '../../../store/auth/auth.actions';
import { selectAuthError, selectAuthLoading } from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AsyncPipe,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);

  readonly loading$ = this.store.select(selectAuthLoading);
  readonly error$ = this.store.select(selectAuthError);

  readonly usernameMin = USERNAME_MIN_LENGTH;
  readonly usernameMax = USERNAME_MAX_LENGTH;
  readonly passwordMin = PASSWORD_MIN_LENGTH;
  readonly passwordMax = PASSWORD_MAX_LENGTH;

  readonly form = this.fb.nonNullable.group({
    username: ['', usernameValidators],
    password: ['', passwordValidators],
    confirmPassword: ['', [Validators.required, passwordMatchValidator()]],
  });

  constructor() {
    this.form.controls.password.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.form.controls.confirmPassword.updateValueAndValidity();
      });
  }

  ngOnInit(): void {
    this.store.dispatch(AuthActions.clearError());
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, password } = this.form.getRawValue();

    this.store.dispatch(
      AuthActions.register({
        credentials: {
          username: normalizeUsername(username),
          password,
        },
      }),
    );

    this.form.controls.password.reset('');
    this.form.controls.confirmPassword.reset('');
  }

  protected usernameError(): string | null {
    const control = this.form.controls.username;
    if (!control.touched || !control.errors) {
      return null;
    }
    if (control.errors['required']) {
      return 'Username is required.';
    }
    if (control.errors['minlength'] || control.errors['maxlength']) {
      return `Username must be ${USERNAME_MIN_LENGTH}–${USERNAME_MAX_LENGTH} characters.`;
    }
    if (control.errors['pattern']) {
      return 'Username may only contain letters, numbers, dots, underscores, and hyphens.';
    }
    return null;
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

  protected confirmPasswordError(): string | null {
    const control = this.form.controls.confirmPassword;
    if (!control.touched || !control.errors) {
      return null;
    }
    if (control.errors['required']) {
      return 'Please confirm your password.';
    }
    if (control.errors['passwordMismatch']) {
      return 'Passwords do not match.';
    }
    return null;
  }
}
