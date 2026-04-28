import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CostoLabor, ReportesService } from '../../../core/services/reportes.service';

@Component({
  selector: 'app-costo-labor',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatInputModule, MatFormFieldModule, MatCardModule],
  providers: [CurrencyPipe],
  templateUrl: './costo-labor.component.html',
  styleUrls: ['./costo-labor.component.scss']
})
export class CostoLaborComponent implements OnInit {
  private reportesService = inject(ReportesService);
  private snackBar = inject(MatSnackBar);

  dataSource = new MatTableDataSource<any>([]);
  datos = signal<any[]>([]); // kept for compat
  displayedColumns: string[] = ['proyecto', 'horas', 'costo', 'grafica'];
  loading = signal(true);

  maxCosto = computed(() => {
    if (!this.datos().length) return 1;
    return Math.max(...this.datos().map(d => d.costo_estimado_labor || 0));
  });

    ngOnInit() {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const getValues = (obj: any): string => {
        return Object.values(obj).map(val => {
          if (val !== null && typeof val === 'object') {
            return getValues(val);
          }
          return String(val);
        }).join(' ');
      };
      const dataStr = getValues(data).toLowerCase();
      return dataStr.includes(filter);
    };
    this.loadDatos();
  }

  async loadDatos() {
    this.loading.set(true);
    try {
      const data = await this.reportesService.getCostoLabor();
      this.datos.set(data);
      this.dataSource.data = data;
    } catch (error: any) {
      this.snackBar.open('Error al cargar reporte: ' + error.message, 'Cerrar', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
