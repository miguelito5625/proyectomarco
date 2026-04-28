import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GastoProyecto, GastosProyectoService } from '../../../core/services/gastos.service';
import { GastosFormComponent } from '../gastos-form/gastos-form.component';

@Component({
  selector: 'app-gastos-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatSnackBarModule, MatCardModule, MatTooltipModule
  ],
  providers: [DatePipe, CurrencyPipe],
  templateUrl: './gastos-list.component.html',
  styleUrls: ['./gastos-list.component.scss']
})
export class GastosListComponent implements OnInit {
  private gastosService = inject(GastosProyectoService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  dataSource = new MatTableDataSource<any>([]);
  gastos = signal<any[]>([]); // kept for compat
  displayedColumns: string[] = ['fecha', 'proyecto', 'concepto', 'monto', 'trabajador', 'acciones'];
  loading = signal(true);

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
    this.loadGastos();
  }

  async loadGastos() {
    this.loading.set(true);
    try {
      const data = await this.gastosService.getGastos();
      this.gastos.set(data);
      this.dataSource.data = data;
    } catch (error: any) {
      this.snackBar.open('Error al cargar gastos: ' + error.message, 'Cerrar', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  openForm(gasto?: GastoProyecto) {
    const dialogRef = this.dialog.open(GastosFormComponent, {
      width: '500px',
      data: { gasto }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadGastos();
    });
  }

  async deleteGasto(gasto: GastoProyecto) {
    if (confirm(`¿Eliminar gasto de ${gasto.concepto}?`)) {
      try {
        await this.gastosService.deleteGasto(gasto.id!);
        this.snackBar.open('Gasto eliminado', 'Cerrar', { duration: 3000 });
        this.loadGastos();
      } catch (error: any) {
        this.snackBar.open('Error al eliminar: ' + error.message, 'Cerrar', { duration: 5000 });
      }
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
