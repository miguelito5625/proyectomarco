import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface DashboardStats {
  totalProyectos: number;
  proyectosActivos: number;
  totalTrabajadores: number;
  trabajadoresActivos: number;
  totalHoras: number;
  totalHorasRegulares: number;
  totalHorasExtra: number;
  totalHorasSabado: number;
  totalGasolina: number;
  totalCostoLabor: number;
  totalGastos: number;
  totalRegistros: number;
}

export interface TopProject {
  id: string;
  nombre: string;
  estatus: string;
  horas: number;
  horasExtra: number;
  costo: number;
  registros: number;
  percentage: number;
}

export interface TopWorker {
  id: string;
  nombre: string;
  horas: number;
  costo: number;
  registros: number;
  percentage: number;
}

export interface RecentActivityItem {
  id: string;
  fecha: string;
  trabajadorNombre: string;
  proyectoNombre: string;
  horas: number;
  horasExtra: number;
  gasolina: number;
  costoEstimado: number;
}

export interface DashboardData {
  stats: DashboardStats;
  topProjects: TopProject[];
  topWorkers: TopWorker[];
  recentActivity: RecentActivityItem[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private supabase = inject(SupabaseService).client;

  /**
   * Obtiene todos los registros paginados para evitar el límite de 1000 filas de PostgREST
   */
  private async fetchAllRecords(): Promise<any[]> {
    const pageSize = 1000;
    let from = 0;
    let allRecords: any[] = [];
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await this.supabase
        .from('registros_tiempo')
        .select('id, trabajador_id, proyecto_id, fecha, horas, horas_extra, gasolina, tarifa_regular, tarifa_extra, tarifa_sabado')
        .range(from, from + pageSize - 1);

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

  async getDashboardData(): Promise<DashboardData> {
    // 1. Fetch proyectos, trabajadores, gastos y registros de tiempo en paralelo
    const [proyectosRes, trabajadoresRes, gastosRes, registros, recentRes] = await Promise.all([
      this.supabase.from('proyectos').select('id, nombre, estatus'),
      this.supabase.from('trabajadores').select('id, nombre, estatus, pago_hora_regular, pago_hora_extra, pago_sabado'),
      this.supabase.from('gastos_proyecto').select('monto'),
      this.fetchAllRecords(),
      this.supabase
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
          proyecto_id,
          trabajadores ( nombre, pago_hora_regular, pago_hora_extra, pago_sabado ),
          proyectos ( nombre )
        `)
        .order('fecha', { ascending: false })
        .limit(7)
    ]);

    if (proyectosRes.error) throw proyectosRes.error;
    if (trabajadoresRes.error) throw trabajadoresRes.error;

    const proyectos = proyectosRes.data || [];
    const trabajadores = trabajadoresRes.data || [];
    const gastos = gastosRes.data || [];
    const recentRecords = recentRes.data || [];

    // Mapeo rápido por ID
    const projectMap = new Map<string, any>();
    proyectos.forEach(p => projectMap.set(p.id, p));

    const workerMap = new Map<string, any>();
    trabajadores.forEach(t => workerMap.set(t.id, t));

    // 2. Acumuladores globales
    let totalHoras = 0;
    let totalHorasRegulares = 0;
    let totalHorasExtra = 0;
    let totalHorasSabado = 0;
    let totalGasolina = 0;
    let totalCostoLabor = 0;

    // Acumuladores por proyecto y trabajador
    const projectAgg = new Map<string, { horas: number; horasExtra: number; costo: number; registros: number }>();
    const workerAgg = new Map<string, { horas: number; costo: number; registros: number }>();

    for (const r of registros) {
      const horas = Number(r.horas) || 0;
      const horasExtra = Number(r.horas_extra) || 0;
      const gasolina = Number(r.gasolina) || 0;

      const t = workerMap.get(r.trabajador_id);
      const pagoHoraRegular = r.tarifa_regular ?? t?.pago_hora_regular ?? 0;
      const pagoHoraExtra = r.tarifa_extra ?? t?.pago_hora_extra ?? 0;
      const pagoSabado = r.tarifa_sabado ?? t?.pago_sabado ?? pagoHoraRegular;

      const dateObj = new Date(r.fecha + 'T12:00:00Z');
      const isSaturday = dateObj.getUTCDay() === 6;
      const rateToUse = isSaturday ? pagoSabado : pagoHoraRegular;

      const recordCost = (horas * rateToUse) + (horasExtra * pagoHoraExtra) + gasolina;

      if (isSaturday) {
        totalHorasSabado += horas;
      } else {
        totalHorasRegulares += horas;
      }
      totalHorasExtra += horasExtra;
      totalGasolina += gasolina;
      totalHoras += (horas + horasExtra);
      totalCostoLabor += recordCost;

      // Agregado por Proyecto
      if (r.proyecto_id) {
        const pEntry = projectAgg.get(r.proyecto_id) || { horas: 0, horasExtra: 0, costo: 0, registros: 0 };
        pEntry.horas += (horas + horasExtra);
        pEntry.horasExtra += horasExtra;
        pEntry.costo += recordCost;
        pEntry.registros += 1;
        projectAgg.set(r.proyecto_id, pEntry);
      }

      // Agregado por Trabajador
      if (r.trabajador_id) {
        const wEntry = workerAgg.get(r.trabajador_id) || { horas: 0, costo: 0, registros: 0 };
        wEntry.horas += (horas + horasExtra);
        wEntry.costo += recordCost;
        wEntry.registros += 1;
        workerAgg.set(r.trabajador_id, wEntry);
      }
    }

    // Total gastos
    const totalGastos = gastos.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);

    // Conteo proyectos activos
    const proyectosActivos = proyectos.filter(
      p => (p.estatus || 'activo').toLowerCase() === 'activo'
    ).length;

    // Conteo trabajadores activos
    const trabajadoresActivos = trabajadores.filter(
      t => (t.estatus || 'activo').toLowerCase() === 'activo'
    ).length;

    // 3. Top 5 Proyectos por Horas
    const projectList: TopProject[] = [];
    for (const [projId, agg] of projectAgg.entries()) {
      const proj = projectMap.get(projId);
      if (proj) {
        projectList.push({
          id: projId,
          nombre: proj.nombre,
          estatus: proj.estatus || 'activo',
          horas: Math.round(agg.horas * 100) / 100,
          horasExtra: Math.round(agg.horasExtra * 100) / 100,
          costo: Math.round(agg.costo * 100) / 100,
          registros: agg.registros,
          percentage: 0
        });
      }
    }
    projectList.sort((a, b) => b.horas - a.horas);
    const topProjects = projectList.slice(0, 5);
    const maxProjectHours = topProjects[0]?.horas || 1;
    topProjects.forEach(p => {
      p.percentage = Math.round((p.horas / maxProjectHours) * 100);
    });

    // 4. Top 5 Trabajadores por Horas
    const workerList: TopWorker[] = [];
    for (const [workId, agg] of workerAgg.entries()) {
      const worker = workerMap.get(workId);
      if (worker) {
        workerList.push({
          id: workId,
          nombre: worker.nombre,
          horas: Math.round(agg.horas * 100) / 100,
          costo: Math.round(agg.costo * 100) / 100,
          registros: agg.registros,
          percentage: 0
        });
      }
    }
    workerList.sort((a, b) => b.horas - a.horas);
    const topWorkers = workerList.slice(0, 5);
    const maxWorkerHours = topWorkers[0]?.horas || 1;
    topWorkers.forEach(w => {
      w.percentage = Math.round((w.horas / maxWorkerHours) * 100);
    });

    // 5. Actividad Reciente
    const recentActivity: RecentActivityItem[] = recentRecords.map((r: any) => {
      const t = Array.isArray(r.trabajadores) ? r.trabajadores[0] : r.trabajadores;
      const p = Array.isArray(r.proyectos) ? r.proyectos[0] : r.proyectos;

      const horas = Number(r.horas) || 0;
      const horasExtra = Number(r.horas_extra) || 0;
      const gasolina = Number(r.gasolina) || 0;

      const pagoHoraRegular = r.tarifa_regular ?? t?.pago_hora_regular ?? 0;
      const pagoHoraExtra = r.tarifa_extra ?? t?.pago_hora_extra ?? 0;
      const pagoSabado = r.tarifa_sabado ?? t?.pago_sabado ?? pagoHoraRegular;

      const dateObj = new Date(r.fecha + 'T12:00:00Z');
      const isSaturday = dateObj.getUTCDay() === 6;
      const rateToUse = isSaturday ? pagoSabado : pagoHoraRegular;

      const costoEstimado = (horas * rateToUse) + (horasExtra * pagoHoraExtra) + gasolina;

      return {
        id: r.id,
        fecha: r.fecha,
        trabajadorNombre: t?.nombre || 'Desconocido',
        proyectoNombre: p?.nombre || 'Sin Proyecto',
        horas,
        horasExtra,
        gasolina,
        costoEstimado: Math.round(costoEstimado * 100) / 100
      };
    });

    return {
      stats: {
        totalProyectos: proyectos.length,
        proyectosActivos,
        totalTrabajadores: trabajadores.length,
        trabajadoresActivos,
        totalHoras: Math.round(totalHoras * 100) / 100,
        totalHorasRegulares: Math.round(totalHorasRegulares * 100) / 100,
        totalHorasExtra: Math.round(totalHorasExtra * 100) / 100,
        totalHorasSabado: Math.round(totalHorasSabado * 100) / 100,
        totalGasolina: Math.round(totalGasolina * 100) / 100,
        totalCostoLabor: Math.round(totalCostoLabor * 100) / 100,
        totalGastos: Math.round(totalGastos * 100) / 100,
        totalRegistros: registros.length
      },
      topProjects,
      topWorkers,
      recentActivity
    };
  }
}
