import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Proyecto, ProyectosService } from '../../../core/services/proyectos.service';
import { Trabajador, TrabajadoresService } from '../../../core/services/trabajadores.service';
import { RegistroTiempo, RegistrosTiempoService } from '../../../core/services/registros-tiempo.service';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-registros-tiempov2-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatIconModule,
    MatSelectModule, MatSnackBarModule, MatCardModule,
    MatDatepickerModule, MatNativeDateModule, ReactiveFormsModule, FormsModule
  ],
  templateUrl: './registros-tiempov2-list.component.html',
  styleUrls: ['./registros-tiempov2-list.component.scss']
})
export class RegistrosTiempov2ListComponent implements OnInit {
  private supabase = inject(SupabaseService).client;
  private proyectosService = inject(ProyectosService);
  private trabajadoresService = inject(TrabajadoresService);
  private registrosService = inject(RegistrosTiempoService);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  saving = signal(false);
  isDirty = signal(false);

  trabajadoresActivos: Trabajador[] = [];
  trabajadoresFiltrados: Trabajador[] = [];
  proyectosActivos: Proyecto[] = [];
  proyectosFiltrados: Proyecto[] = [];

  selectedTrabajadorId = new FormControl<string>('');
  selectedProyectosId = new FormControl<string[]>([]);
  dateRange = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null)
  });

  dates: Date[] = [];
  displayedColumns: string[] = ['proyecto'];
  
  dataSource: any[] = [];
  
  originalData = new Map<string, { id?: string, horas: number, horas_extra: number, gasolina: number }>();
  changes = new Map<string, { horas: number | null, horas_extra: number | null, gasolina: number | null }>();

  ngOnInit() {
    this.loadInitialData();

    this.selectedTrabajadorId.valueChanges.subscribe(() => this.onFilterChange());
    this.selectedProyectosId.valueChanges.subscribe(() => this.onFilterChange());
    this.dateRange.valueChanges.subscribe(() => this.onFilterChange());
  }

  async loadInitialData() {
    this.loading.set(true);
    try {
      const [trabajadores, proyectos] = await Promise.all([
        this.trabajadoresService.getTrabajadores(),
        this.proyectosService.getProyectos()
      ]);
      this.trabajadoresActivos = trabajadores.filter(t => t.estatus?.toLowerCase() === 'activo');
      this.trabajadoresFiltrados = [...this.trabajadoresActivos];
      this.proyectosActivos = proyectos.filter(p => p.estatus?.toLowerCase() === 'activo');
      this.proyectosFiltrados = [...this.proyectosActivos];
    } catch (error: any) {
      this.snackBar.open('Error al cargar datos: ' + error.message, 'Cerrar', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  async onFilterChange() {
    const trabajadorId = this.selectedTrabajadorId.value;
    const proyectosId = this.selectedProyectosId.value;
    const start = this.dateRange.value.start;
    const end = this.dateRange.value.end;

    if (!trabajadorId || !proyectosId || proyectosId.length === 0 || !start || !end) {
      this.clearTable();
      return;
    }

    this.loading.set(true);
    try {
      await this.buildTable(trabajadorId, proyectosId, start, end);
    } catch (error: any) {
      this.snackBar.open('Error al cargar registros: ' + error.message, 'Cerrar', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  filtrarTrabajadores(event: Event) {
    const input = event.target as HTMLInputElement;
    const filterValue = input.value.toLowerCase();
    this.trabajadoresFiltrados = this.trabajadoresActivos.filter(t => 
      t.nombre.toLowerCase().includes(filterValue)
    );
  }

  filtrarProyectos(event: Event) {
    const input = event.target as HTMLInputElement;
    const filterValue = input.value.toLowerCase();
    this.proyectosFiltrados = this.proyectosActivos.filter(p => 
      p.nombre.toLowerCase().includes(filterValue)
    );
  }

  clearTable() {
    this.dates = [];
    this.displayedColumns = ['proyecto'];
    this.dataSource = [];
    this.originalData.clear();
    this.changes.clear();
    this.isDirty.set(false);
  }

  async buildTable(trabajadorId: string, proyectosId: string[], start: Date, end: Date) {
    this.clearTable();

    let currentDate = new Date(start);
    currentDate.setHours(0,0,0,0);
    const endDate = new Date(end);
    endDate.setHours(0,0,0,0);

    while (currentDate <= endDate) {
      this.dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const dateColumns = this.dates.map(d => this.formatDateISO(d));
    this.displayedColumns = ['proyecto', ...dateColumns];

    const startStr = this.formatDateISO(start);
    const endStr = this.formatDateISO(end);

    const { data: registros, error } = await this.supabase
      .from('registros_tiempo')
      .select('*')
      .eq('trabajador_id', trabajadorId)
      .gte('fecha', startStr)
      .lte('fecha', endStr);

    if (error) throw error;

    const proyectosSeleccionados = this.proyectosActivos.filter(p => proyectosId.includes(p.id!));

    this.dataSource = proyectosSeleccionados.map(p => {
      const row: any = { proyecto: p };
      for (const d of dateColumns) {
        row[d] = { horas: null, horas_extra: null, gasolina: null };
      }
      return row;
    });

    for (const reg of registros || []) {
      const pId = reg.proyecto_id;
      const dateISO = reg.fecha.split('T')[0];
      
      const row = this.dataSource.find(r => r.proyecto.id === pId);
      if (row && dateColumns.includes(dateISO)) {
        row[dateISO] = { horas: reg.horas, horas_extra: reg.horas_extra || 0, gasolina: reg.gasolina || 0 };
        this.originalData.set(`${pId}_${dateISO}`, { id: reg.id, horas: reg.horas, horas_extra: reg.horas_extra || 0, gasolina: reg.gasolina || 0 });
      }
    }
  }

  formatDateISO(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  formatColumnHeader(dateStr: string): string {
    const [y, m, d] = dateStr.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    
    return `${dayName} ${dayNum} ${monthName}`;
  }

  onValueChange(proyectoId: string, dateISO: string, field: 'horas' | 'horas_extra' | 'gasolina', value: string) {
    const numValue = value === '' || value === null ? null : Number(value);
    const key = `${proyectoId}_${dateISO}`;
    const original = this.originalData.get(key) || { horas: null, horas_extra: null, gasolina: null };

    const row = this.dataSource.find(r => r.proyecto.id === proyectoId);
    if (row) {
      row[dateISO][field] = numValue;
    }

    const currentState = row ? { ...row[dateISO] } : { horas: null, horas_extra: null, gasolina: null };

    const isDifferent = 
      (currentState.horas !== original.horas) || 
      (currentState.horas_extra !== original.horas_extra) || 
      (currentState.gasolina !== original.gasolina);

    if (!isDifferent) {
      this.changes.delete(key);
    } else {
      this.changes.set(key, currentState);
    }

    this.isDirty.set(this.changes.size > 0);
  }

  async guardar() {
    if (this.changes.size === 0) return;

    this.saving.set(true);
    const trabajadorId = this.selectedTrabajadorId.value!;
    const trabajador = this.trabajadoresActivos.find(t => t.id === trabajadorId);
    const tarifaRegular = trabajador?.pago_hora_regular || 0;
    const tarifaExtra = trabajador?.pago_hora_extra || 0;
    const tarifaSabado = trabajador?.pago_sabado || tarifaRegular;
    
    try {
      const promises = [];
      for (const [key, values] of this.changes.entries()) {
        const [proyectoId, dateISO] = key.split('_');
        const original = this.originalData.get(key);

        const h = values.horas || 0;
        const he = values.horas_extra || 0;
        const g = values.gasolina || 0;

        if (original && original.id) {
          if (h === 0 && he === 0 && g === 0) {
             promises.push(this.registrosService.deleteRegistro(original.id));
          } else {
             promises.push(this.registrosService.updateRegistro(original.id, { horas: h, horas_extra: he, gasolina: g }));
          }
        } else {
          if (h > 0 || he > 0 || g > 0) {
            promises.push(this.registrosService.createRegistro({
              trabajador_id: trabajadorId,
              proyecto_id: proyectoId,
              fecha: dateISO,
              horas: h,
              horas_extra: he,
              gasolina: g,
              tarifa_regular: tarifaRegular,
              tarifa_extra: tarifaExtra,
              tarifa_sabado: tarifaSabado
            }));
          }
        }
      }

      await Promise.all(promises);
      this.snackBar.open('Cambios guardados exitosamente', 'Cerrar', { duration: 3000 });
      
      const start = this.dateRange.value.start;
      const end = this.dateRange.value.end;
      const proyectosId = this.selectedProyectosId.value;
      if (start && end && proyectosId && proyectosId.length > 0) {
        await this.buildTable(trabajadorId, proyectosId, start, end);
      }
    } catch (error: any) {
      this.snackBar.open('Error al guardar: ' + error.message, 'Cerrar', { duration: 5000 });
    } finally {
      this.saving.set(false);
    }
  }
}
