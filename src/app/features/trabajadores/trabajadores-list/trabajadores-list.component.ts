import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Trabajador, TrabajadoresService } from '../../../core/services/trabajadores.service';
import { TrabajadoresFormComponent } from '../trabajadores-form/trabajadores-form.component';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-trabajadores-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatSnackBarModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './trabajadores-list.component.html',
  styleUrls: ['./trabajadores-list.component.scss']
})
export class TrabajadoresListComponent implements OnInit {
  private trabajadoresService = inject(TrabajadoresService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  dataSource = new MatTableDataSource<any>([]);
  trabajadores = signal<any[]>([]); // kept for compat
  displayedColumns: string[] = ['nombre', 'pago_hora_regular', 'pago_hora_extra', 'pago_sabado', 'estatus', 'acciones'];
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
    this.loadTrabajadores();
  }

  async loadTrabajadores() {
    this.loading.set(true);
    try {
      const data = await this.trabajadoresService.getTrabajadores();
      this.trabajadores.set(data);
      this.dataSource.data = data;
    } catch (error: any) {
      this.snackBar.open('Error al cargar trabajadores: ' + error.message, 'Cerrar', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  openForm(trabajador?: Trabajador) {
    const dialogRef = this.dialog.open(TrabajadoresFormComponent, {
      width: '500px',
      data: { trabajador }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTrabajadores();
      }
    });
  }

  async deleteTrabajador(trabajador: Trabajador) {
    if (confirm(`¿Estás seguro de eliminar a ${trabajador.nombre}?`)) {
      try {
        await this.trabajadoresService.deleteTrabajador(trabajador.id!);
        this.snackBar.open('Trabajador eliminado', 'Cerrar', { duration: 3000 });
        this.loadTrabajadores();
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
