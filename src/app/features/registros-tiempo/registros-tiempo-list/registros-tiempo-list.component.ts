import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RegistroTiempo, RegistrosTiempoService } from '../../../core/services/registros-tiempo.service';
import { RegistrosTiempoFormComponent } from '../registros-tiempo-form/registros-tiempo-form.component';

@Component({
  selector: 'app-registros-tiempo-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatSnackBarModule, MatCardModule, MatTooltipModule,
    MatDatepickerModule, MatNativeDateModule, ReactiveFormsModule
  ],
  providers: [DatePipe],
  templateUrl: './registros-tiempo-list.component.html',
  styleUrls: ['./registros-tiempo-list.component.scss']
})
export class RegistrosTiempoListComponent implements OnInit {
  private registrosService = inject(RegistrosTiempoService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  dataSource = new MatTableDataSource<any>([]);
  registros = signal<any[]>([]); // kept for compat
  displayedColumns: string[] = ['fecha', 'trabajador', 'proyecto', 'horas', 'acciones'];
  loading = signal(true);

  dateRange = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null)
  });

  currentSearchTerm = '';

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
      
      let searchFilter = filter;
      let dateFilterObj: { start?: string | null, end?: string | null } | null = null;
      
      try {
        const parsed = JSON.parse(filter);
        if (parsed && typeof parsed === 'object' && 'search' in parsed) {
          searchFilter = parsed.search;
          dateFilterObj = parsed.dateFilter;
        }
      } catch (e) {
        // filter was just a normal string
      }

      const dataStr = getValues(data).toLowerCase();
      const matchSearch = dataStr.includes(searchFilter);

      let matchDate = true;
      if (dateFilterObj && data.fecha) {
        // append T00:00:00 to avoid timezone shifts if the date is just YYYY-MM-DD
        const rowDateStr = data.fecha.includes('T') ? data.fecha : data.fecha + 'T00:00:00';
        const rowDate = new Date(rowDateStr);
        rowDate.setHours(0, 0, 0, 0);

        if (dateFilterObj.start) {
          const startDate = new Date(dateFilterObj.start);
          startDate.setHours(0, 0, 0, 0);
          if (rowDate < startDate) matchDate = false;
        }
        if (dateFilterObj.end) {
          const endDate = new Date(dateFilterObj.end);
          endDate.setHours(0, 0, 0, 0);
          if (rowDate > endDate) matchDate = false;
        }
      }

      return matchSearch && matchDate;
    };
    this.loadRegistros();
  }

  async loadRegistros() {
    this.loading.set(true);
    try {
      const data = await this.registrosService.getRegistros();
      this.registros.set(data);
      this.dataSource.data = data;
    } catch (error: any) {
      this.snackBar.open('Error al cargar registros: ' + error.message, 'Cerrar', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  openForm(registro?: RegistroTiempo) {
    const dialogRef = this.dialog.open(RegistrosTiempoFormComponent, {
      width: '500px',
      data: { registro }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadRegistros();
    });
  }

  async deleteRegistro(registro: RegistroTiempo) {
    if (confirm(`¿Estás seguro de eliminar el registro de ${registro.horas}hrs para ${registro.trabajadores?.nombre}?`)) {
      try {
        await this.registrosService.deleteRegistro(registro.id!);
        this.snackBar.open('Registro eliminado', 'Cerrar', { duration: 3000 });
        this.loadRegistros();
      } catch (error: any) {
        this.snackBar.open('Error al eliminar: ' + error.message, 'Cerrar', { duration: 5000 });
      }
    }
  }

  applyFilter(event: Event) {
    this.currentSearchTerm = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.updateTableFilter();
  }

  applyDateFilter() {
    this.updateTableFilter();
  }

  clearDateFilter(event: Event) {
    event.stopPropagation();
    this.dateRange.reset();
    this.updateTableFilter();
  }

  updateTableFilter() {
    const filterObj = {
      search: this.currentSearchTerm,
      dateFilter: this.dateRange.value
    };
    this.dataSource.filter = JSON.stringify(filterObj);
  }
}
