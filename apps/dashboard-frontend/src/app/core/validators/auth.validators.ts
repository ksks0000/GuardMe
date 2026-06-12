import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 50;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

export const usernameValidators = [
  Validators.required,
  Validators.minLength(USERNAME_MIN_LENGTH),
  Validators.maxLength(USERNAME_MAX_LENGTH),
  Validators.pattern(USERNAME_PATTERN),
];

export const passwordValidators = [
  Validators.required,
  Validators.minLength(PASSWORD_MIN_LENGTH),
  Validators.maxLength(PASSWORD_MAX_LENGTH),
];

export function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.parent?.get('password')?.value;
    const confirmPassword = control.value;

    if (!confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { passwordMismatch: true };
  };
}

export function normalizeUsername(username: string): string {
  return username.trim();
}
