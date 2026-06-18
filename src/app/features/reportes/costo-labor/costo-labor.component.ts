import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CostoLabor, CostoLaborFilters, ReportesService } from '../../../core/services/reportes.service';
import { Proyecto, ProyectosService } from '../../../core/services/proyectos.service';

@Component({
  selector: 'app-costo-labor',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatInputModule, MatFormFieldModule, MatCardModule,
    MatIconModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatButtonModule, ReactiveFormsModule
  ],
  providers: [CurrencyPipe],
  templateUrl: './costo-labor.component.html',
  styleUrls: ['./costo-labor.component.scss']
})
export class CostoLaborComponent implements OnInit {
  private reportesService = inject(ReportesService);
  private proyectosService = inject(ProyectosService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  dataSource = new MatTableDataSource<CostoLabor>([]);
  datos = signal<CostoLabor[]>([]);
  displayedColumns: string[] = ['proyecto', 'estatus', 'horas', 'horas_sabado', 'horas_extra', 'gasolina', 'costo', 'grafica', 'desglose'];
  loading = signal(false);
  hasSearched = signal(false);
  filterError = signal('');

  // Filter controls
  proyectos: Proyecto[] = [];
  proyectosFiltrados: Proyecto[] = [];
  selectedProyectoIds = new FormControl<string[]>([]);
  selectedEstatus = new FormControl<string>('');
  dateRange = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null)
  });

  maxCosto = computed(() => {
    if (!this.datos().length) return 1;
    return Math.max(...this.datos().map(d => d.costo_estimado_labor || 0));
  });

  ngOnInit() {
    this.loadProyectos();
  }

  async loadProyectos() {
    try {
      this.proyectos = await this.proyectosService.getProyectos();
      this.proyectosFiltrados = [...this.proyectos];
    } catch (error: any) {
      this.snackBar.open('Error al cargar proyectos: ' + error.message, 'Cerrar', { duration: 5000 });
    }
  }

  filtrarProyectos(event: Event) {
    const input = event.target as HTMLInputElement;
    const filterValue = input.value.toLowerCase();
    this.proyectosFiltrados = this.proyectos.filter(p =>
      p.nombre.toLowerCase().includes(filterValue)
    );
  }

  /**
   * Validates that required filters are filled.
   * Returns an error message or empty string if valid.
   */
  private validateFilters(): string {
    const errors: string[] = [];

    const proyectoIds = this.selectedProyectoIds.value;
    if (!proyectoIds || proyectoIds.length === 0) {
      errors.push('al menos un proyecto');
    }

    const start = this.dateRange.value.start;
    const end = this.dateRange.value.end;
    if (!start || !end) {
      errors.push('el rango de fechas (inicio y fin)');
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
    // Validate filters
    const error = this.validateFilters();
    if (error) {
      this.filterError.set(error);
      return;
    }

    this.filterError.set('');
    this.loading.set(true);
    try {
      const filters: CostoLaborFilters = {};

      const proyectoIds = this.selectedProyectoIds.value;
      if (proyectoIds && proyectoIds.length > 0) {
        filters.proyectoIds = proyectoIds;
      }

      const estatus = this.selectedEstatus.value;
      if (estatus) {
        filters.estatus = estatus;
      }

      const start = this.dateRange.value.start;
      const end = this.dateRange.value.end;
      if (start && end) {
        filters.fechaInicio = this.formatDateISO(start);
        filters.fechaFin = this.formatDateISO(end);
      }

      const data = await this.reportesService.getCostoLaborFiltered(filters);
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

  verDesglose(element: CostoLabor) {
    const queryParams: any = {};
    const start = this.dateRange.value.start;
    const end = this.dateRange.value.end;
    if (start && end) {
      queryParams.fechaInicio = this.formatDateISO(start);
      queryParams.fechaFin = this.formatDateISO(end);
    }
    this.router.navigate(['/reporte-costo-labor', element.proyecto_id, 'desglose'], { queryParams });
  }
}
