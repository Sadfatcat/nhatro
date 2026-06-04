import { effect, inject, Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private storage = inject(StorageService);
  theme           = signal<Theme>((this.storage.get<Theme>('theme') as Theme) ?? 'light');

  constructor() {
    effect(() => {
      const theme = this.theme();

      document.documentElement.setAttribute('data-theme', theme);
      document.body.classList.toggle('theme-dark', theme === 'dark');
      this.storage.set('theme', theme);
    });
  }

  toggle(): void {
    this.theme.update(t => (t === 'light' ? 'dark' : 'light'));
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }
}
