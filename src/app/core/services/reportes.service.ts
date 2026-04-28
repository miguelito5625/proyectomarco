import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface CostoLabor {
  proyecto_id: string;
  proyecto_nombre: string;
  total_horas_labor: number;
  costo_estimado_labor: number;
}

export interface HorasTrabajador {
  proyecto_nombre: string;
  trabajador_nombre: string;
  total_horas: number;
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private supabase = inject(SupabaseService).client;

  async getCostoLabor(): Promise<CostoLabor[]> {
    const { data, error } = await this.supabase
      .from('vista_costo_labor_proyecto')
      .select('*')
      .order('costo_estimado_labor', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getHorasTrabajador(): Promise<HorasTrabajador[]> {
    const { data, error } = await this.supabase
      .from('vista_horas_por_trabajador_proyecto')
      .select('*')
      .order('proyecto_nombre', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}
