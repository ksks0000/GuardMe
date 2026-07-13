import { AbstractControl } from '@angular/forms';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from '../validators/auth.validators';

export function usernameControlError(control: AbstractControl | null): string | null {
  if (!control?.touched || !control.errors) {
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

export function passwordControlError(control: AbstractControl | null): string | null {
  if (!control?.touched || !control.errors) {
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

export function confirmPasswordControlError(control: AbstractControl | null): string | null {
  if (!control?.touched || !control.errors) {
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
