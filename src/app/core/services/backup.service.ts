import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface TableStats {
  trabajadores: number;
  proyectos: number;
  registros_tiempo: number;
  nominas: number;
  gastos_proyecto: number;
}

export interface BackupData {
  metadata: {
    app: string;
    version: string;
    created_at: string;
    description: string;
    counts: TableStats;
  };
  data: {
    trabajadores: any[];
    proyectos: any[];
    registros_tiempo: any[];
    nominas: any[];
    gastos_proyecto: any[];
  };
}

export interface ProgressState {
  active: boolean;
  type: 'export' | 'import' | 'idle';
  step: string;
  progress: number;
  details?: string;
  error?: string | null;
  completed?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BackupService {
  private supabase = inject(SupabaseService).client;

  progress = signal<ProgressState>({
    active: false,
    type: 'idle',
    step: '',
    progress: 0,
    completed: false
  });

  async getDatabaseStats(): Promise<TableStats> {
    const [trabajadores, proyectos, registros, nominas, gastos] = await Promise.all([
      this.supabase.from('trabajadores').select('*', { count: 'exact', head: true }),
      this.supabase.from('proyectos').select('*', { count: 'exact', head: true }),
      this.supabase.from('registros_tiempo').select('*', { count: 'exact', head: true }),
      this.supabase.from('nominas').select('*', { count: 'exact', head: true }),
      this.supabase.from('gastos_proyecto').select('*', { count: 'exact', head: true })
    ]);

    return {
      trabajadores: trabajadores.count ?? 0,
      proyectos: proyectos.count ?? 0,
      registros_tiempo: registros.count ?? 0,
      nominas: nominas.count ?? 0,
      gastos_proyecto: gastos.count ?? 0
    };
  }

  private async fetchAllFromTable(table: string, onBatch?: (count: number) => void): Promise<any[]> {
    const pageSize = 1000;
    let allRows: any[] = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await this.supabase
        .from(table)
        .select('*')
        .range(from, from + pageSize - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allRows = allRows.concat(data);
        if (onBatch) onBatch(allRows.length);
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          from += pageSize;
        }
      } else {
        hasMore = false;
      }
    }
    return allRows;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async exportBackup(): Promise<{ filename: string; stats: TableStats; sizeKb: number }> {
    this.progress.set({
      active: true,
      type: 'export',
      step: 'Iniciando conexión con la base de datos...',
      progress: 5,
      completed: false,
      error: null
    });

    try {
      await this.delay(350);

      // 1. Trabajadores
      this.progress.set({
        active: true,
        type: 'export',
        step: 'Extrayendo trabajadores...',
        progress: 15,
        details: 'Leyendo registros de empleados y tarifas'
      });
      const trabajadores = await this.fetchAllFromTable('trabajadores');
      await this.delay(250);

      // 2. Proyectos
      this.progress.set({
        active: true,
        type: 'export',
        step: 'Extrayendo proyectos...',
        progress: 30,
        details: `${trabajadores.length} trabajadores extraídos. Leyendo proyectos...`
      });
      const proyectos = await this.fetchAllFromTable('proyectos');
      await this.delay(250);

      // 3. Registros de Tiempo (Labor)
      this.progress.set({
        active: true,
        type: 'export',
        step: 'Extrayendo registros de labor (horas)...',
        progress: 50,
        details: `${proyectos.length} proyectos extraídos. Leyendo registros de tiempo...`
      });
      const registrosTiempo = await this.fetchAllFromTable('registros_tiempo', (count) => {
        this.progress.update(p => ({
          ...p,
          details: `Labor: ${count} registros leídos...`
        }));
      });
      await this.delay(250);

      // 4. Nóminas
      this.progress.set({
        active: true,
        type: 'export',
        step: 'Extrayendo registros de nóminas...',
        progress: 70,
        details: `${registrosTiempo.length} registros de labor leídos. Leyendo nóminas...`
      });
      const nominas = await this.fetchAllFromTable('nominas');
      await this.delay(200);

      // 5. Gastos Proyecto
      this.progress.set({
        active: true,
        type: 'export',
        step: 'Extrayendo gastos de proyectos...',
        progress: 85,
        details: `${nominas.length} nóminas leídas. Leyendo gastos...`
      });
      const gastosProyecto = await this.fetchAllFromTable('gastos_proyecto');
      await this.delay(200);

      // 6. Construir objeto JSON
      this.progress.set({
        active: true,
        type: 'export',
        step: 'Empaquetando archivo JSON y calculando metadatos...',
        progress: 95,
        details: 'Generando archivo estructurado...'
      });
      await this.delay(300);

      const stats: TableStats = {
        trabajadores: trabajadores.length,
        proyectos: proyectos.length,
        registros_tiempo: registrosTiempo.length,
        nominas: nominas.length,
        gastos_proyecto: gastosProyecto.length
      };

      const now = new Date();
      const backupData: BackupData = {
        metadata: {
          app: 'proyectomarco',
          version: '1.0',
          created_at: now.toISOString(),
          description: 'Copia de seguridad completa de la base de datos de Proyecto Marco',
          counts: stats
        },
        data: {
          trabajadores,
          proyectos,
          registros_tiempo: registrosTiempo,
          nominas,
          gastos_proyecto: gastosProyecto
        }
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const sizeKb = Math.round((blob.size / 1024) * 10) / 10;

      // Disparar descarga en el navegador
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `backup_proyectomarco_${timestamp}.json`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      this.progress.set({
        active: false,
        type: 'export',
        step: '¡Respaldo generado y descargado con éxito!',
        progress: 100,
        details: `${filename} (${sizeKb} KB) guardado en tus descargas.`,
        completed: true,
        error: null
      });

      return { filename, stats, sizeKb };
    } catch (err: any) {
      const errorMsg = err?.message || 'Error desconocido al exportar el respaldo';
      this.progress.set({
        active: false,
        type: 'export',
        step: 'Error al exportar respaldo',
        progress: 0,
        details: errorMsg,
        completed: false,
        error: errorMsg
      });
      throw err;
    }
  }

  validateBackupJson(rawJson: string): { valid: boolean; error?: string; backup?: BackupData } {
    try {
      const parsed = JSON.parse(rawJson);

      if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: 'El archivo no contiene un JSON válido.' };
      }

      if (!parsed.data || typeof parsed.data !== 'object') {
        return { valid: false, error: 'Estructura inválida: Falta la sección "data" en el archivo.' };
      }

      const { data } = parsed;
      const requiredTables = ['trabajadores', 'proyectos', 'registros_tiempo', 'nominas', 'gastos_proyecto'];
      for (const table of requiredTables) {
        if (!Array.isArray(data[table])) {
          return { valid: false, error: `Estructura inválida: La tabla "${table}" debe ser una lista de registros.` };
        }
      }

      const counts: TableStats = {
        trabajadores: data.trabajadores.length,
        proyectos: data.proyectos.length,
        registros_tiempo: data.registros_tiempo.length,
        nominas: data.nominas.length,
        gastos_proyecto: data.gastos_proyecto.length
      };

      const backup: BackupData = {
        metadata: {
          app: parsed.metadata?.app || 'proyectomarco',
          version: parsed.metadata?.version || '1.0',
          created_at: parsed.metadata?.created_at || new Date().toISOString(),
          description: parsed.metadata?.description || 'Respaldo importado',
          counts
        },
        data: {
          trabajadores: data.trabajadores,
          proyectos: data.proyectos,
          registros_tiempo: data.registros_tiempo,
          nominas: data.nominas,
          gastos_proyecto: data.gastos_proyecto
        }
      };

      return { valid: true, backup };
    } catch (e: any) {
      return { valid: false, error: 'Error de sintaxis JSON: ' + (e?.message || 'archivo corrupto') };
    }
  }

  async restoreFromBackup(backup: BackupData): Promise<TableStats> {
    this.progress.set({
      active: true,
      type: 'import',
      step: 'Iniciando restauración de la base de datos...',
      progress: 5,
      completed: false,
      error: null
    });

    try {
      await this.delay(350);

      // FASE 1: Limpieza ordenada (hijos primero para respetar FK)
      this.progress.set({
        active: true,
        type: 'import',
        step: 'Limpiando tablas dependientes actuales...',
        progress: 15,
        details: 'Eliminando gastos, nóminas y registros de tiempo previos'
      });

      // Borrar gastos_proyecto
      const { error: errGastosDel } = await this.supabase
        .from('gastos_proyecto')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (errGastosDel) throw errGastosDel;

      // Borrar nominas
      const { error: errNominasDel } = await this.supabase
        .from('nominas')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (errNominasDel) throw errNominasDel;

      // Borrar registros_tiempo
      const { error: errRegistrosDel } = await this.supabase
        .from('registros_tiempo')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (errRegistrosDel) throw errRegistrosDel;

      await this.delay(200);

      // Borrar padres: proyectos y trabajadores
      this.progress.set({
        active: true,
        type: 'import',
        step: 'Limpiando proyectos y trabajadores anteriores...',
        progress: 25,
        details: 'Preparando inserción de datos limpios'
      });

      const { error: errProyectosDel } = await this.supabase
        .from('proyectos')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (errProyectosDel) throw errProyectosDel;

      const { error: errTrabajadoresDel } = await this.supabase
        .from('trabajadores')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (errTrabajadoresDel) throw errTrabajadoresDel;

      await this.delay(250);

      // FASE 2: Inserción ordenada (padres primero)

      // 1. Trabajadores
      this.progress.set({
        active: true,
        type: 'import',
        step: 'Restaurando trabajadores...',
        progress: 40,
        details: `Insertando ${backup.data.trabajadores.length} trabajadores...`
      });
      await this.insertInBatches('trabajadores', backup.data.trabajadores, 100);
      await this.delay(200);

      // 2. Proyectos
      this.progress.set({
        active: true,
        type: 'import',
        step: 'Restaurando proyectos...',
        progress: 55,
        details: `Insertando ${backup.data.proyectos.length} proyectos...`
      });
      await this.insertInBatches('proyectos', backup.data.proyectos, 100);
      await this.delay(200);

      // 3. Registros de Tiempo (Labor)
      this.progress.set({
        active: true,
        type: 'import',
        step: 'Restaurando registros de labor...',
        progress: 75,
        details: `Insertando ${backup.data.registros_tiempo.length} registros de tiempo...`
      });
      await this.insertInBatches('registros_tiempo', backup.data.registros_tiempo, 250, (inserted, total) => {
        this.progress.update(p => ({
          ...p,
          details: `Labor: ${inserted} de ${total} registros insertados...`
        }));
      });
      await this.delay(200);

      // 4. Nóminas
      this.progress.set({
        active: true,
        type: 'import',
        step: 'Restaurando nóminas...',
        progress: 88,
        details: `Insertando ${backup.data.nominas.length} nóminas...`
      });
      await this.insertInBatches('nominas', backup.data.nominas, 100);
      await this.delay(150);

      // 5. Gastos Proyecto
      this.progress.set({
        active: true,
        type: 'import',
        step: 'Restaurando gastos de proyecto...',
        progress: 95,
        details: `Insertando ${backup.data.gastos_proyecto.length} gastos...`
      });
      await this.insertInBatches('gastos_proyecto', backup.data.gastos_proyecto, 100);
      await this.delay(200);

      const restoredCounts: TableStats = {
        trabajadores: backup.data.trabajadores.length,
        proyectos: backup.data.proyectos.length,
        registros_tiempo: backup.data.registros_tiempo.length,
        nominas: backup.data.nominas.length,
        gastos_proyecto: backup.data.gastos_proyecto.length
      };

      this.progress.set({
        active: false,
        type: 'import',
        step: '¡Base de datos restaurada exitosamente!',
        progress: 100,
        details: `Se restauraron ${restoredCounts.trabajadores} trabajadores, ${restoredCounts.proyectos} proyectos y ${restoredCounts.registros_tiempo} registros de labor.`,
        completed: true,
        error: null
      });

      return restoredCounts;
    } catch (err: any) {
      const errorMsg = err?.message || 'Error inesperado durante la restauración.';
      this.progress.set({
        active: false,
        type: 'import',
        step: 'Error durante la restauración',
        progress: 0,
        details: errorMsg,
        completed: false,
        error: errorMsg
      });
      throw err;
    }
  }

  private async insertInBatches(table: string, rows: any[], batchSize: number, onProgress?: (inserted: number, total: number) => void): Promise<void> {
    if (!rows || rows.length === 0) return;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await this.supabase.from(table).insert(batch);
      if (error) {
        throw new Error(`Error en tabla ${table} (lote ${i + 1}-${i + batch.length}): ${error.message}`);
      }
      if (onProgress) {
        onProgress(Math.min(i + batchSize, rows.length), rows.length);
      }
    }
  }
}
