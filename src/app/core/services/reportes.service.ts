import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface CostoLabor {
  proyecto_id: string;
  proyecto_nombre: string;
  proyecto_estatus: string;
  total_horas_labor: number;
  total_horas_sabado: number;
  total_horas_extra: number;
  total_gasolina: number;
  costo_estimado_labor: number;
}

export interface CostoLaborFilters {
  proyectoIds?: string[];
  fechaInicio?: string;  // ISO date string YYYY-MM-DD
  fechaFin?: string;     // ISO date string YYYY-MM-DD
  estatus?: string;      // 'activo', 'inactivo', or '' for all
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

  /**
   * Fetches labor cost data with optional filters.
   * Since the DB view doesn't support filtering by date/estatus,
   * we query the raw tables and aggregate in code.
   */
  async getCostoLaborFiltered(filters: CostoLaborFilters): Promise<CostoLabor[]> {
    // 1. Fetch projects (filtered by estatus and/or IDs)
    let proyectosQuery = this.supabase
      .from('proyectos')
      .select('id, nombre, estatus');

    if (filters.estatus) {
      proyectosQuery = proyectosQuery.eq('estatus', filters.estatus);
    }

    if (filters.proyectoIds && filters.proyectoIds.length > 0) {
      proyectosQuery = proyectosQuery.in('id', filters.proyectoIds);
    }

    const { data: proyectos, error: proyectosError } = await proyectosQuery;
    if (proyectosError) throw proyectosError;
    if (!proyectos || proyectos.length === 0) return [];

    // 2. Fetch time records with optional date range filter
    const proyectoIdsList = proyectos.map(p => p.id);
    let registrosQuery = this.supabase
      .from('registros_tiempo')
      .select('proyecto_id, fecha, horas, horas_extra, gasolina, trabajador_id')
      .in('proyecto_id', proyectoIdsList);

    if (filters.fechaInicio) {
      registrosQuery = registrosQuery.gte('fecha', filters.fechaInicio);
    }
    if (filters.fechaFin) {
      registrosQuery = registrosQuery.lte('fecha', filters.fechaFin);
    }

    const { data: registros, error: registrosError } = await registrosQuery;
    if (registrosError) throw registrosError;

    // 3. Fetch workers for pay rates
    const trabajadorIds = [...new Set((registros || []).map(r => r.trabajador_id))];
    let trabajadoresMap = new Map<string, any>();

    if (trabajadorIds.length > 0) {
      const { data: trabajadores, error: trabajadoresError } = await this.supabase
        .from('trabajadores')
        .select('id, pago_hora_regular, pago_hora_extra, pago_sabado')
        .in('id', trabajadorIds);

      if (trabajadoresError) throw trabajadoresError;
      for (const t of trabajadores || []) {
        trabajadoresMap.set(t.id, t);
      }
    }

    // 4. Aggregate by project
    const resultMap = new Map<string, CostoLabor>();
    for (const p of proyectos) {
      resultMap.set(p.id, {
        proyecto_id: p.id,
        proyecto_nombre: p.nombre,
        proyecto_estatus: p.estatus || 'activo',
        total_horas_labor: 0,
        total_horas_sabado: 0,
        total_horas_extra: 0,
        total_gasolina: 0,
        costo_estimado_labor: 0
      });
    }

    for (const r of registros || []) {
      const entry = resultMap.get(r.proyecto_id);
      if (entry) {
        const horas = Number(r.horas) || 0;
        const horasExtra = Number(r.horas_extra) || 0;
        const gasolina = Number(r.gasolina) || 0;
        
        const t = trabajadoresMap.get(r.trabajador_id);
        const pagoHoraRegular = t?.pago_hora_regular || 0;
        const pagoHoraExtra = t?.pago_hora_extra || 0;
        const pagoSabado = t?.pago_sabado || pagoHoraRegular; // Fallback to regular if not set

        // Determine if the date is a Saturday
        const dateObj = new Date(r.fecha + 'T12:00:00Z');
        const isSaturday = dateObj.getUTCDay() === 6;

        const rateToUse = isSaturday ? pagoSabado : pagoHoraRegular;

        if (isSaturday) {
          entry.total_horas_sabado += horas;
        } else {
          entry.total_horas_labor += horas;
        }
        
        entry.total_horas_extra += horasExtra;
        entry.total_gasolina += gasolina;
        entry.costo_estimado_labor += (horas * rateToUse) + (horasExtra * pagoHoraExtra) + gasolina;
      }
    }

    // 5. Sort by cost descending and return
    return Array.from(resultMap.values())
      .sort((a, b) => b.costo_estimado_labor - a.costo_estimado_labor);
  }

  async getHorasTrabajador(): Promise<HorasTrabajador[]> {
    const { data, error } = await this.supabase
      .from('vista_horas_por_trabajador_proyecto')
      .select('*')
      .order('proyecto_nombre', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getCostoLaborDesglose(proyectoId: string, fechaInicio?: string, fechaFin?: string): Promise<any[]> {
    let query = this.supabase
      .from('registros_tiempo')
      .select(`
        id,
        fecha,
        horas,
        horas_extra,
        gasolina,
        trabajador_id,
        trabajadores ( nombre )
      `)
      .eq('proyecto_id', proyectoId)
      .order('fecha', { ascending: false });

    if (fechaInicio) {
      query = query.gte('fecha', fechaInicio);
    }
    if (fechaFin) {
      query = query.lte('fecha', fechaFin);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    // Process to add isSaturday flag
    return (data || []).map(row => {
      const dateObj = new Date(row.fecha + 'T12:00:00Z');
      const isSaturday = dateObj.getUTCDay() === 6;
      const t: any = row.trabajadores;
      const trabajador_nombre = Array.isArray(t) ? t[0]?.nombre : t?.nombre;
      return {
        ...row,
        trabajador_nombre,
        isSaturday
      };
    });
  }
}
