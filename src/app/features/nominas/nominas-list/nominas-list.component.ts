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
import { Nomina, NominasService } from '../../../core/services/nominas.service';
import { NominasFormComponent } from '../nominas-form/nominas-form.component';

@Component({
  selector: 'app-nominas-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatSnackBarModule, MatCardModule, MatTooltipModule
  ],
  providers: [DatePipe, CurrencyPipe],
  templateUrl: './nominas-list.component.html',
  styleUrls: ['./nominas-list.component.scss']
})
export class NominasListComponent implements OnInit {
  private nominasService = inject(NominasService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  dataSource = new MatTableDataSource<any>([]);
  nominas = signal<any[]>([]); // kept for compat
  displayedColumns: string[] = ['periodo', 'trabajador', 'horas', 'total', 'acciones'];
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
    this.loadNominas();
  }

  async loadNominas() {
    this.loading.set(true);
    try {
      const data = await this.nominasService.getNominas();
      this.nominas.set(data);
      this.dataSource.data = data;
    } catch (error: any) {
      this.snackBar.open('Error al cargar nóminas: ' + error.message, 'Cerrar', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  openForm(nomina?: Nomina) {
    const dialogRef = this.dialog.open(NominasFormComponent, {
      width: '500px',
      data: { nomina }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadNominas();
    });
  }

  async deleteNomina(nomina: Nomina) {
    if (confirm(`¿Eliminar nómina de ${nomina.trabajadores?.nombre}?`)) {
      try {
        await this.nominasService.deleteNomina(nomina.id!);
        this.snackBar.open('Nómina eliminada', 'Cerrar', { duration: 3000 });
        this.loadNominas();
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
