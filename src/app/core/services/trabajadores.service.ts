import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Trabajador {
  id?: string;
  nombre: string;
  pago_hora_regular: number;
  pago_hora_extra: number;
  pago_sabado: number;
  estatus: string;
  fecha_creacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TrabajadoresService {
  private supabase = inject(SupabaseService).client;

  async getTrabajadores(): Promise<Trabajador[]> {
    const { data, error } = await this.supabase
      .from('trabajadores')
      .select('*')
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getTrabajador(id: string): Promise<Trabajador> {
    const { data, error } = await this.supabase
      .from('trabajadores')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createTrabajador(trabajador: Trabajador): Promise<Trabajador> {
    const { data, error } = await this.supabase
      .from('trabajadores')
      .insert([trabajador])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTrabajador(id: string, trabajador: Partial<Trabajador>): Promise<Trabajador> {
    const { data, error } = await this.supabase
      .from('trabajadores')
      .update(trabajador)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTrabajador(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('trabajadores')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
