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
  total_horas_regulares: number;
  total_horas_sabado: number;
  total_horas_extra: number;
  total_otros_gasolina: number;
  costo_estimado: number;
  total_horas: number;
}

export interface HorasTrabajadorFilters {
  proyectoIds?: string[];
  trabajadorIds?: string[];
  fechaInicio?: string;
  fechaFin?: string;
  estatus?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private supabase = inject(SupabaseService).client;

  /**
   * Obtiene registros de tiempo paginados por lotes para evitar el límite de 1000 filas de PostgREST
   */
  private async fetchRegistrosTiempoPaginado(
    proyectoIds: string[],
    fechaInicio?: string,
    fechaFin?: string,
    trabajadorIds?: string[]
  ): Promise<any[]> {
    const pageSize = 1000;
    let from = 0;
    let allRecords: any[] = [];
    let hasMore = true;

    while (hasMore) {
      let query = this.supabase
        .from('registros_tiempo')
        .select('id, proyecto_id, fecha, horas, horas_extra, gasolina, trabajador_id, tarifa_regular, tarifa_extra, tarifa_sabado')
        .in('proyecto_id', proyectoIds);

      if (trabajadorIds && trabajadorIds.length > 0) {
        query = query.in('trabajador_id', trabajadorIds);
      }
      if (fechaInicio) {
        query = query.gte('fecha', fechaInicio);
      }
      if (fechaFin) {
        query = query.lte('fecha', fechaFin);
      }

      query = query.range(from, from + pageSize - 1);

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        allRecords = allRecords.concat(data);
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          from += pageSize;
        }
      } else {
        hasMore = false;
      }
    }

    return allRecords;
  }

  /**
   * Fetches labor cost data with optional filters.
   * We query the raw tables with pagination and aggregate in code to calculate
   * extra hours, gasoline, saturday rates and apply filters.
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

    // 2. Fetch time records with optional date range filter (paginated)
    const proyectoIdsList = proyectos.map(p => p.id);
    const registros = await this.fetchRegistrosTiempoPaginado(
      proyectoIdsList,
      filters.fechaInicio,
      filters.fechaFin
    );

    // 3. Fetch workers for pay rates (used as emergency fallback only)
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
        const pagoHoraRegular = r.tarifa_regular != null ? Number(r.tarifa_regular) : (t?.pago_hora_regular ?? 0);
        const pagoHoraExtra = r.tarifa_extra != null ? Number(r.tarifa_extra) : (t?.pago_hora_extra ?? 0);
        const pagoSabado = r.tarifa_sabado != null ? Number(r.tarifa_sabado) : (t?.pago_sabado ?? pagoHoraRegular);

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



  async getHorasTrabajadorFiltered(filters: HorasTrabajadorFilters): Promise<HorasTrabajador[]> {
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

    let trabajadoresQuery = this.supabase
      .from('trabajadores')
      .select('id, nombre, pago_hora_regular, pago_hora_extra, pago_sabado');
      
    if (filters.trabajadorIds && filters.trabajadorIds.length > 0) {
      trabajadoresQuery = trabajadoresQuery.in('id', filters.trabajadorIds);
    }
    const { data: trabajadores, error: trabajadoresError } = await trabajadoresQuery;
    if (trabajadoresError) throw trabajadoresError;
    if (!trabajadores || trabajadores.length === 0) return [];

    const proyectoIdsList = proyectos.map(p => p.id);
    const trabajadorIdsList = trabajadores.map(t => t.id);

    // Fetch paginated time records
    const registros = await this.fetchRegistrosTiempoPaginado(
      proyectoIdsList,
      filters.fechaInicio,
      filters.fechaFin,
      trabajadorIdsList
    );

    const map = new Map<string, HorasTrabajador>();
    
    for (const r of registros || []) {
      const p = proyectos.find(proj => proj.id === r.proyecto_id);
      const t = trabajadores.find(trab => trab.id === r.trabajador_id);
      if (!p || !t) continue;
      
      const key = `${r.trabajador_id}_${r.proyecto_id}`;
      if (!map.has(key)) {
        map.set(key, {
          proyecto_nombre: p.nombre,
          trabajador_nombre: t.nombre,
          total_horas_regulares: 0,
          total_horas_sabado: 0,
          total_horas_extra: 0,
          total_otros_gasolina: 0,
          costo_estimado: 0,
          total_horas: 0
        });
      }
      
      const entry = map.get(key)!;
      const horas = Number(r.horas) || 0;
      const horasExtra = Number(r.horas_extra) || 0;
      const gasolina = Number(r.gasolina) || 0;

      const pagoHoraRegular = r.tarifa_regular != null ? Number(r.tarifa_regular) : (t.pago_hora_regular ?? 0);
      const pagoHoraExtra = r.tarifa_extra != null ? Number(r.tarifa_extra) : (t.pago_hora_extra ?? 0);
      const pagoSabado = r.tarifa_sabado != null ? Number(r.tarifa_sabado) : (t.pago_sabado ?? pagoHoraRegular);

      const dateObj = new Date(r.fecha + 'T12:00:00Z');
      const isSaturday = dateObj.getUTCDay() === 6;
      const rateToUse = isSaturday ? pagoSabado : pagoHoraRegular;

      if (isSaturday) {
        entry.total_horas_sabado += horas;
      } else {
        entry.total_horas_regulares += horas;
      }
      entry.total_horas_extra += horasExtra;
      entry.total_otros_gasolina += gasolina;
      entry.total_horas += (horas + horasExtra);
      entry.costo_estimado += (horas * rateToUse) + (horasExtra * pagoHoraExtra) + gasolina;
    }
    
    return Array.from(map.values()).sort((a, b) => 
      a.trabajador_nombre.localeCompare(b.trabajador_nombre) || a.proyecto_nombre.localeCompare(b.proyecto_nombre)
    );
  }

  async getCostoLaborDesglose(proyectoId: string, fechaInicio?: string, fechaFin?: string): Promise<any[]> {
    const pageSize = 1000;
    let from = 0;
    let allRecords: any[] = [];
    let hasMore = true;

    while (hasMore) {
      let query = this.supabase
        .from('registros_tiempo')
        .select(`
          id,
          fecha,
          horas,
          horas_extra,
          gasolina,
          tarifa_regular,
          tarifa_extra,
          tarifa_sabado,
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

      query = query.range(from, from + pageSize - 1);

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        allRecords = allRecords.concat(data);
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          from += pageSize;
        }
      } else {
        hasMore = false;
      }
    }
    
    // Process to add isSaturday flag
    return (allRecords || []).map(row => {
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
