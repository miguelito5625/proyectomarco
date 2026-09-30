import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface RegistroTiempo {
  id?: string;
  trabajador_id: string;
  proyecto_id: string;
  fecha: string;
  horas: number;
  horas_extra?: number;
  gasolina?: number;
  tarifa_regular?: number;
  tarifa_extra?: number;
  tarifa_sabado?: number;
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
    const payload = {
      ...registro,
      horas: Math.max(0, Number(registro.horas) || 0),
      horas_extra: Math.max(0, Number(registro.horas_extra) || 0),
      gasolina: Math.max(0, Number(registro.gasolina) || 0),
      tarifa_regular: Math.max(0, Number(registro.tarifa_regular) || 0),
      tarifa_extra: Math.max(0, Number(registro.tarifa_extra) || 0),
      tarifa_sabado: Math.max(0, Number(registro.tarifa_sabado) || 0),
    };

    const { data, error } = await this.supabase
      .from('registros_tiempo')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateRegistro(id: string, registro: Partial<RegistroTiempo>): Promise<RegistroTiempo> {
    const payload: Partial<RegistroTiempo> = { ...registro };
    if ('horas' in payload) payload.horas = Math.max(0, Number(payload.horas) || 0);
    if ('horas_extra' in payload) payload.horas_extra = Math.max(0, Number(payload.horas_extra) || 0);
    if ('gasolina' in payload) payload.gasolina = Math.max(0, Number(payload.gasolina) || 0);
    if ('tarifa_regular' in payload && payload.tarifa_regular !== undefined) {
      payload.tarifa_regular = Math.max(0, Number(payload.tarifa_regular) || 0);
    }
    if ('tarifa_extra' in payload && payload.tarifa_extra !== undefined) {
      payload.tarifa_extra = Math.max(0, Number(payload.tarifa_extra) || 0);
    }
    if ('tarifa_sabado' in payload && payload.tarifa_sabado !== undefined) {
      payload.tarifa_sabado = Math.max(0, Number(payload.tarifa_sabado) || 0);
    }

    const { data, error } = await this.supabase
      .from('registros_tiempo')
      .update(payload)
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
