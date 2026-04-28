import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Nomina {
  id?: string;
  trabajador_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  trabajo_sabado: boolean;
  horas_regulares: number;
  horas_extra: number;
  horas_permiso: number;
  monto_notas_extra: number;
  notas?: string;
  total_pago: number;
  fecha_creacion?: string;
  trabajadores?: { nombre: string };
}

@Injectable({ providedIn: 'root' })
export class NominasService {
  private supabase = inject(SupabaseService).client;

  async getNominas(): Promise<Nomina[]> {
    const { data, error } = await this.supabase
      .from('nominas')
      .select('*, trabajadores ( nombre )')
      .order('fecha_inicio', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createNomina(nomina: Partial<Nomina>): Promise<Nomina> {
    const { data, error } = await this.supabase.from('nominas').insert([nomina]).select().single();
    if (error) throw error;
    return data;
  }

  async updateNomina(id: string, nomina: Partial<Nomina>): Promise<Nomina> {
    const { data, error } = await this.supabase.from('nominas').update(nomina).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async deleteNomina(id: string): Promise<void> {
    const { error } = await this.supabase.from('nominas').delete().eq('id', id);
    if (error) throw error;
  }
}
