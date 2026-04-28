import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const supabaseService = inject(SupabaseService);
  
  // Usar getSession de Supabase directamente de forma asíncrona
  const { data: { session } } = await supabaseService.client.auth.getSession();
  
  if (session) {
    return true;
  }

  // Si no hay sesión válida, redirigir al login
  return router.parseUrl('/login');
};
