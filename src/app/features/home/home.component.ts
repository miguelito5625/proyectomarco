import { Component, inject, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { SupabaseService } from '../../core/services/supabase.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  private supabase = inject(SupabaseService);
  currentUser = toSignal(this.supabase.currentUser);
  
  userName = computed(() => {
    const user = this.currentUser();
    return user?.user_metadata?.['display_name'] || user?.email || '';
  });
}
