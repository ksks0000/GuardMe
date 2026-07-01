import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  passwordValidators,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  usernameValidators,
} from '../../../core/validators/auth.validators';
import { AuthActions } from '../../../store/auth/auth.actions';
import { selectAuthError, selectAuthLoading } from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-login',
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
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);

  readonly loading$ = this.store.select(selectAuthLoading);
  readonly error$ = this.store.select(selectAuthError);

  readonly usernameMin = USERNAME_MIN_LENGTH;
  readonly usernameMax = USERNAME_MAX_LENGTH;
  readonly passwordMin = PASSWORD_MIN_LENGTH;
  readonly passwordMax = PASSWORD_MAX_LENGTH;

  readonly form = this.fb.nonNullable.group({
    username: ['', usernameValidators],
    password: ['', passwordValidators],
  });

  ngOnInit(): void {
    this.store.dispatch(AuthActions.clearError());
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, password } = this.form.getRawValue();
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? undefined;

    this.store.dispatch(
      AuthActions.login({
        credentials: {
          username: normalizeUsername(username),
          password,
        },
        returnUrl,
      }),
    );

    this.form.controls.password.reset('');
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
}
