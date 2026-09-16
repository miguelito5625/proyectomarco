import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { toSignal } from '@angular/core/rxjs-interop';

import { SupabaseService } from '../../core/services/supabase.service';
import { DashboardService, DashboardData } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CurrencyPipe,
    DecimalPipe,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private dashboardService = inject(DashboardService);

  currentUser = toSignal(this.supabase.currentUser);
  data = signal<DashboardData | null>(null);
  loading = signal<boolean>(true);
  refreshing = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  userName = computed(() => {
    const user = this.currentUser();
    return user?.user_metadata?.['display_name'] || user?.email?.split('@')[0] || 'Usuario';
  });

  currentDate = computed(() => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const now = new Date();
    const str = now.toLocaleDateString('es-ES', options);
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  ngOnInit(): void {
    this.loadDashboardData();
  }

  async loadDashboardData(isRefresh = false): Promise<void> {
    if (isRefresh) {
      this.refreshing.set(true);
    } else {
      this.loading.set(true);
    }
    this.errorMessage.set(null);

    try {
      const result = await this.dashboardService.getDashboardData();
      this.data.set(result);
    } catch (err: any) {
      console.error('Error al cargar datos del dashboard:', err);
      this.errorMessage.set(err?.message || 'Error al conectar con la base de datos.');
    } finally {
      this.loading.set(false);
      this.refreshing.set(false);
    }
  }

  getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
}
