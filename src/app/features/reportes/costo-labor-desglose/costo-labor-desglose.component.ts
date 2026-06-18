import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReportesService } from '../../../core/services/reportes.service';
import { ProyectosService, Proyecto } from '../../../core/services/proyectos.service';

@Component({
  selector: 'app-costo-labor-desglose',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatCardModule
  ],
  providers: [DatePipe, CurrencyPipe],
  templateUrl: './costo-labor-desglose.component.html',
  styleUrls: ['./costo-labor-desglose.component.scss']
})
export class CostoLaborDesgloseComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reportesService = inject(ReportesService);
  private proyectosService = inject(ProyectosService);
  private snackBar = inject(MatSnackBar);

  proyectoId = '';
  fechaInicio = '';
  fechaFin = '';
  proyectoNombre = signal('');
  
  loading = signal(true);
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['fecha', 'trabajador', 'horas_regulares', 'horas_sabado', 'horas_extra', 'gasolina'];

  ngOnInit() {
    this.proyectoId = this.route.snapshot.paramMap.get('id') || '';
    this.fechaInicio = this.route.snapshot.queryParamMap.get('fechaInicio') || '';
    this.fechaFin = this.route.snapshot.queryParamMap.get('fechaFin') || '';

    if (this.proyectoId) {
      this.loadDatos();
    }
  }

  async loadDatos() {
    this.loading.set(true);
    try {
      const p = await this.proyectosService.getProyecto(this.proyectoId);
      this.proyectoNombre.set(p.nombre);

      const data = await this.reportesService.getCostoLaborDesglose(this.proyectoId, this.fechaInicio, this.fechaFin);
      this.dataSource.data = data;
    } catch (error: any) {
      this.snackBar.open('Error al cargar desglose: ' + error.message, 'Cerrar', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  volver() {
    this.router.navigate(['/reporte-costo-labor']);
  }
}
