import { Injectable, signal, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type AppTheme = 'theme-azure-blue' | 'theme-rose-red' | 'theme-magenta-violet' | 'theme-cyan-orange';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  currentTheme = signal<AppTheme>('theme-azure-blue');
  private readonly THEME_KEY = 'app-theme-preference';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem(this.THEME_KEY) as AppTheme;
      if (savedTheme) {
        this.setTheme(savedTheme);
      } else {
        this.setTheme('theme-azure-blue');
      }
    }
  }

  setTheme(theme: AppTheme) {
    this.currentTheme.set(theme);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.THEME_KEY, theme);
      const html = document.documentElement;
      // Remover todas las clases de tema anteriores
      html.classList.remove('theme-azure-blue', 'theme-rose-red', 'theme-magenta-violet', 'theme-cyan-orange');
      // Aplicar la nueva clase (el default es sin clase, pero podemos aplicarla o simplemente usar las otras)
      if (theme !== 'theme-azure-blue') {
        html.classList.add(theme);
      }
    }
  }
}
