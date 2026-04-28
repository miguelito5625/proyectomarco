import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const noAuthGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const supabaseService = inject(SupabaseService);
  
  // Usar getSession de Supabase directamente de forma asíncrona
  const { data: { session } } = await supabaseService.client.auth.getSession();
  
  if (session) {
    // Si ya hay sesión válida, redirigir al home
    return router.parseUrl('/home');
  }

  return true;
};
