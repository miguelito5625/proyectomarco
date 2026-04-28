import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Proyecto, ProyectosService } from '../../../core/services/proyectos.service';
import { ProyectosFormComponent } from '../proyectos-form/proyectos-form.component';

@Component({
  selector: 'app-proyectos-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatSnackBarModule, MatCardModule, MatChipsModule, MatTooltipModule
  ],
  templateUrl: './proyectos-list.component.html',
  styleUrls: ['./proyectos-list.component.scss']
})
export class ProyectosListComponent implements OnInit {
  private proyectosService = inject(ProyectosService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  dataSource = new MatTableDataSource<any>([]);
  proyectos = signal<any[]>([]); // kept for compat
  displayedColumns: string[] = ['nombre', 'direccion', 'estatus', 'acciones'];
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
    this.loadProyectos();
  }

  async loadProyectos() {
    this.loading.set(true);
    try {
      const data = await this.proyectosService.getProyectos();
      this.proyectos.set(data);
      this.dataSource.data = data;
    } catch (error: any) {
      this.snackBar.open('Error al cargar proyectos: ' + error.message, 'Cerrar', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  openForm(proyecto?: Proyecto) {
    const dialogRef = this.dialog.open(ProyectosFormComponent, {
      width: '500px',
      data: { proyecto }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadProyectos();
    });
  }

  async deleteProyecto(proyecto: Proyecto) {
    if (confirm(`¿Estás seguro de eliminar el proyecto ${proyecto.nombre}?`)) {
      try {
        await this.proyectosService.deleteProyecto(proyecto.id!);
        this.snackBar.open('Proyecto eliminado', 'Cerrar', { duration: 3000 });
        this.loadProyectos();
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
