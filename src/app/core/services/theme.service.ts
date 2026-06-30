import { Injectable, signal, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type AppTheme = 'theme-azure-blue' | 'theme-rose-red' | 'theme-magenta-violet' | 'theme-cyan-orange';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  currentTheme = signal<AppTheme>('theme-azure-blue');
  isDarkMode = signal<boolean>(false);
  private readonly THEME_KEY = 'app-theme-preference';
  private readonly DARK_MODE_KEY = 'app-dark-mode-preference';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem(this.THEME_KEY) as AppTheme;
      if (savedTheme) {
        this.currentTheme.set(savedTheme);
      }
      
      const savedDarkMode = localStorage.getItem(this.DARK_MODE_KEY);
      if (savedDarkMode !== null) {
        this.isDarkMode.set(savedDarkMode === 'true');
      }

      this.applyTheme();
    }
  }

  setTheme(theme: AppTheme) {
    this.currentTheme.set(theme);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.THEME_KEY, theme);
      this.applyTheme();
    }
  }

  toggleDarkMode() {
    this.isDarkMode.set(!this.isDarkMode());
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.DARK_MODE_KEY, String(this.isDarkMode()));
      this.applyTheme();
    }
  }

  private applyTheme() {
    if (isPlatformBrowser(this.platformId)) {
      const html = document.documentElement;
      // Remover todas las clases de tema anteriores
      html.classList.remove('theme-azure-blue', 'theme-rose-red', 'theme-magenta-violet', 'theme-cyan-orange', 'dark-theme');
      
      // Aplicar la nueva clase de color
      const theme = this.currentTheme();
      if (theme !== 'theme-azure-blue') {
        html.classList.add(theme);
      }
      
      // Aplicar modo oscuro si está activo
      if (this.isDarkMode()) {
        html.classList.add('dark-theme');
      }
    }
  }
}
