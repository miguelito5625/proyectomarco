import { Component, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SupabaseService } from '../../core/services/supabase.service';
import { ThemeService, AppTheme } from '../../core/services/theme.service';
import { UserProfileDialogComponent } from '../../features/user/user-profile-dialog/user-profile-dialog.component';
import { ChangePasswordDialogComponent } from '../../features/user/change-password-dialog/change-password-dialog.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive, 
    MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule,
    MatSidenavModule, MatListModule, MatDialogModule
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  animations: [
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: '0', opacity: 0, overflow: 'hidden' }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1, overflow: 'hidden' }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ height: '0', opacity: 0 }))
      ])
    ])
  ]
})
export class MainLayoutComponent {
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  public themeService = inject(ThemeService);
  private dialog = inject(MatDialog);

  currentUser = toSignal(this.supabase.currentUser);
  userName = computed(() => {
    const user = this.currentUser();
    return user?.user_metadata?.['display_name'] || user?.email || '';
  });

  changeTheme(theme: AppTheme) {
    this.themeService.setTheme(theme);
  }

  openUserProfile() {
    this.dialog.open(UserProfileDialogComponent, { width: '400px' });
  }

  openChangePassword() {
    this.dialog.open(ChangePasswordDialogComponent, { width: '400px' });
  }

  isReportesOpen = false;

  toggleReportes() {
    this.isReportesOpen = !this.isReportesOpen;
  }

  async logout() {
    await this.supabase.signOut();
    this.router.navigate(['/login']);
  }
}
