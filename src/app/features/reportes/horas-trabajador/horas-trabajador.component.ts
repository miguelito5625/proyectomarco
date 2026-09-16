import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HorasTrabajador, HorasTrabajadorFilters, ReportesService } from '../../../core/services/reportes.service';
import { Proyecto, ProyectosService } from '../../../core/services/proyectos.service';
import { Trabajador, TrabajadoresService } from '../../../core/services/trabajadores.service';

@Component({
  selector: 'app-horas-trabajador',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatInputModule, MatFormFieldModule, MatCardModule,
    MatIconModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatButtonModule, ReactiveFormsModule
  ],
  providers: [CurrencyPipe],
  templateUrl: './horas-trabajador.component.html',
  styleUrls: ['./horas-trabajador.component.scss']
})
export class HorasTrabajadorComponent implements OnInit {
  private reportesService = inject(ReportesService);
  private proyectosService = inject(ProyectosService);
  private trabajadoresService = inject(TrabajadoresService);
  private snackBar = inject(MatSnackBar);

  dataSource = new MatTableDataSource<HorasTrabajador>([]);
  datos = signal<HorasTrabajador[]>([]);
  displayedColumns: string[] = ['trabajador', 'proyecto', 'horas_regulares', 'horas_sabado', 'horas_extra', 'otros_gasolina', 'costo_estimado'];
  loading = signal(false);
  hasSearched = signal(false);
  filterError = signal('');

  // Filters
  proyectos: Proyecto[] = [];
  proyectosFiltrados: Proyecto[] = [];
  trabajadores: Trabajador[] = [];
  trabajadoresFiltrados: Trabajador[] = [];

  projectSearchText = '';

  selectedProyectoIds = new FormControl<string[]>([]);
  selectedTrabajadorIds = new FormControl<string[]>([]);
  selectedEstatus = new FormControl<string>('');
  dateRange = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null)
  });

  totalHoras = computed(() => {
    return this.datos().reduce((acc, curr) => acc + (curr.total_horas || 0), 0);
  });

  totalCosto = computed(() => {
    return this.datos().reduce((acc, curr) => acc + (curr.costo_estimado || 0), 0);
  });

  ngOnInit() {
    this.loadProyectos();
    this.loadTrabajadores();

    this.selectedEstatus.valueChanges.subscribe(() => {
      this.aplicarFiltroProyectos();
    });
  }

  async loadProyectos() {
    try {
      this.proyectos = await this.proyectosService.getProyectos();
      this.aplicarFiltroProyectos();
    } catch (error: any) {
      this.snackBar.open('Error al cargar proyectos: ' + error.message, 'Cerrar', { duration: 5000 });
    }
  }

  async loadTrabajadores() {
    try {
      this.trabajadores = await this.trabajadoresService.getTrabajadores();
      this.trabajadoresFiltrados = [...this.trabajadores];
    } catch (error: any) {
      this.snackBar.open('Error al cargar trabajadores: ' + error.message, 'Cerrar', { duration: 5000 });
    }
  }

  aplicarFiltroProyectos() {
    const estatus = (this.selectedEstatus.value || '').toLowerCase();
    this.proyectosFiltrados = this.proyectos.filter(p => {
      const matchSearch = p.nombre.toLowerCase().includes(this.projectSearchText.toLowerCase());
      const matchEstatus = !estatus || (p.estatus?.toLowerCase() === estatus);
      return matchSearch && matchEstatus;
    });

    // Clean up selected IDs that are no longer matching the filter
    const validIds = new Set(this.proyectosFiltrados.map(p => p.id!));
    const currentSelected = this.selectedProyectoIds.value || [];
    const updatedSelected = currentSelected.filter(id => validIds.has(id));
    if (updatedSelected.length !== currentSelected.length) {
      this.selectedProyectoIds.setValue(updatedSelected);
    }
  }

  filtrarProyectos(event: Event) {
    this.projectSearchText = (event.target as HTMLInputElement).value;
    this.aplicarFiltroProyectos();
  }

  filtrarTrabajadores(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.trabajadoresFiltrados = this.trabajadores.filter(t =>
      t.nombre.toLowerCase().includes(filterValue)
    );
  }

  seleccionarTodosProyectos() {
    this.selectedProyectoIds.setValue(this.proyectosFiltrados.map(p => p.id!));
  }

  deseleccionarTodosProyectos() {
    this.selectedProyectoIds.setValue([]);
  }

  seleccionarTodosTrabajadores() {
    this.selectedTrabajadorIds.setValue(this.trabajadoresFiltrados.map(t => t.id!));
  }

  deseleccionarTodosTrabajadores() {
    this.selectedTrabajadorIds.setValue([]);
  }

  private validateFilters(): string {
    const errors: string[] = [];
    const proyectoIds = this.selectedProyectoIds.value;
    if (!proyectoIds || proyectoIds.length === 0) {
      errors.push('al menos un proyecto');
    }

    const trabajadorIds = this.selectedTrabajadorIds.value;
    if (!trabajadorIds || trabajadorIds.length === 0) {
      errors.push('al menos un trabajador');
    }

    const start = this.dateRange.value.start;
    const end = this.dateRange.value.end;
    if (!start || !end) {
      errors.push('el rango de fechas');
    }

    const estatus = this.selectedEstatus.value;
    if (estatus === '' || estatus === null) {
      errors.push('el estado del proyecto');
    }

    if (errors.length > 0) {
      return 'Por favor selecciona: ' + errors.join(', ') + '.';
    }
    return '';
  }

  async buscar() {
    const error = this.validateFilters();
    if (error) {
      this.filterError.set(error);
      return;
    }

    this.filterError.set('');
    this.loading.set(true);
    try {
      const filters: HorasTrabajadorFilters = {
        proyectoIds: this.selectedProyectoIds.value || undefined,
        trabajadorIds: this.selectedTrabajadorIds.value || undefined,
        estatus: this.selectedEstatus.value || undefined,
      };

      const start = this.dateRange.value.start;
      const end = this.dateRange.value.end;
      if (start && end) {
        filters.fechaInicio = this.formatDateISO(start);
        filters.fechaFin = this.formatDateISO(end);
      }

      const data = await this.reportesService.getHorasTrabajadorFiltered(filters);
      this.datos.set(data);
      this.dataSource.data = data;
      this.hasSearched.set(true);
    } catch (error: any) {
      this.snackBar.open('Error al cargar reporte: ' + error.message, 'Cerrar', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  limpiarFiltros() {
    this.selectedProyectoIds.setValue([]);
    this.selectedTrabajadorIds.setValue([]);
    this.selectedEstatus.setValue('');
    this.dateRange.reset();
    this.filterError.set('');
    this.hasSearched.set(false);
    this.datos.set([]);
    this.dataSource.data = [];
  }

  private formatDateISO(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
