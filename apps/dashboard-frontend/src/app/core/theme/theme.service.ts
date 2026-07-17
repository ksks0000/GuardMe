import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';
import { DEFAULT_THEME_MODE, isThemeMode, ThemeMode, THEME_STORAGE_KEY } from './theme.model';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  readonly mode = signal<ThemeMode>(this.resolveInitialMode());

  constructor() {
    effect(() => {
      this.applyMode(this.mode());
    });
  }

  toggle(): void {
    this.mode.update((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
  }

  private resolveInitialMode(): ThemeMode {
    const attr = this.document.documentElement.getAttribute('data-theme');
    if (isThemeMode(attr)) {
      return attr;
    }

    return this.readStoredMode() ?? DEFAULT_THEME_MODE;
  }

  private applyMode(mode: ThemeMode): void {
    const root = this.document.documentElement;
    root.setAttribute('data-theme', mode);
    root.style.colorScheme = mode;
    this.persistMode(mode);
  }

  private readStoredMode(): ThemeMode | null {
    try {
      const stored = this.document.defaultView?.localStorage.getItem(THEME_STORAGE_KEY);
      return isThemeMode(stored) ? stored : null;
    } catch {
      // Private browsing or storage blocked -> default theme
      return null;
    }
  }

  private persistMode(mode: ThemeMode): void {
    this.document.defaultView?.localStorage.setItem(THEME_STORAGE_KEY, mode);
  }
}
