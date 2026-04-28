import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface GastoProyecto {
  id?: string;
  proyecto_id: string;
  trabajador_id?: string;
  concepto: string;
  monto: number;
  fecha: string;
  fecha_creacion?: string;
  proyectos?: { nombre: string };
  trabajadores?: { nombre: string };
}

@Injectable({ providedIn: 'root' })
export class GastosProyectoService {
  private supabase = inject(SupabaseService).client;

  async getGastos(): Promise<GastoProyecto[]> {
    const { data, error } = await this.supabase
      .from('gastos_proyecto')
      .select('*, proyectos ( nombre ), trabajadores ( nombre )')
      .order('fecha', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createGasto(gasto: Partial<GastoProyecto>): Promise<GastoProyecto> {
    const { data, error } = await this.supabase.from('gastos_proyecto').insert([gasto]).select().single();
    if (error) throw error;
    return data;
  }

  async updateGasto(id: string, gasto: Partial<GastoProyecto>): Promise<GastoProyecto> {
    const { data, error } = await this.supabase.from('gastos_proyecto').update(gasto).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async deleteGasto(id: string): Promise<void> {
    const { error } = await this.supabase.from('gastos_proyecto').delete().eq('id', id);
    if (error) throw error;
  }
}
