import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface RegistroTiempo {
  id?: string;
  trabajador_id: string;
  proyecto_id: string;
  fecha: string;
  horas: number;
  fecha_creacion?: string;
  trabajadores?: { nombre: string };
  proyectos?: { nombre: string };
}

@Injectable({
  providedIn: 'root'
})
export class RegistrosTiempoService {
  private supabase = inject(SupabaseService).client;

  async getRegistros(): Promise<RegistroTiempo[]> {
    const { data, error } = await this.supabase
      .from('registros_tiempo')
      .select(`
        *,
        trabajadores ( nombre ),
        proyectos ( nombre )
      `)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getRegistro(id: string): Promise<RegistroTiempo> {
    const { data, error } = await this.supabase
      .from('registros_tiempo')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createRegistro(registro: Partial<RegistroTiempo>): Promise<RegistroTiempo> {
    const { data, error } = await this.supabase
      .from('registros_tiempo')
      .insert([registro])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateRegistro(id: string, registro: Partial<RegistroTiempo>): Promise<RegistroTiempo> {
    const { data, error } = await this.supabase
      .from('registros_tiempo')
      .update(registro)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteRegistro(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('registros_tiempo')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
