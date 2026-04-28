import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Proyecto {
  id?: string;
  nombre: string;
  direccion?: string;
  estatus: string;
  fecha_creacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProyectosService {
  private supabase = inject(SupabaseService).client;

  async getProyectos(): Promise<Proyecto[]> {
    const { data, error } = await this.supabase
      .from('proyectos')
      .select('*')
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getProyecto(id: string): Promise<Proyecto> {
    const { data, error } = await this.supabase
      .from('proyectos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createProyecto(proyecto: Proyecto): Promise<Proyecto> {
    const { data, error } = await this.supabase
      .from('proyectos')
      .insert([proyecto])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateProyecto(id: string, proyecto: Partial<Proyecto>): Promise<Proyecto> {
    const { data, error } = await this.supabase
      .from('proyectos')
      .update(proyecto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteProyecto(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('proyectos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
