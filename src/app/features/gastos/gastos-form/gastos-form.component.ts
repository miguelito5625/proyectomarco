import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { GastoProyecto, GastosProyectoService } from '../../../core/services/gastos.service';
import { Proyecto, ProyectosService } from '../../../core/services/proyectos.service';
import { Trabajador, TrabajadoresService } from '../../../core/services/trabajadores.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-gastos-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule
  ],
  templateUrl: './gastos-form.component.html',
  styleUrls: ['./gastos-form.component.scss']
})
export class GastosFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private gastosService = inject(GastosProyectoService);
  private proyectosService = inject(ProyectosService);
  private trabajadoresService = inject(TrabajadoresService);
  private snackBar = inject(MatSnackBar);
  public dialogRef = inject(MatDialogRef<GastosFormComponent>);
  public data: { gasto?: GastoProyecto } = inject(MAT_DIALOG_DATA);

  form!: FormGroup;
  loading = signal(false);
  isEdit = signal(false);

  proyectos = signal<Proyecto[]>([]);
  trabajadores = signal<Trabajador[]>([]);

  ngOnInit() {
    this.isEdit.set(!!this.data?.gasto);
    const g = this.data?.gasto;

    this.form = this.fb.group({
      proyecto_id: [g?.proyecto_id || '', Validators.required],
      trabajador_id: [g?.trabajador_id || ''],
      concepto: [g?.concepto || '', Validators.required],
      monto: [g?.monto || 0, [Validators.required, Validators.min(0)]],
      fecha: [g?.fecha ? new Date(g.fecha + 'T12:00:00Z') : new Date(), Validators.required]
    });

    this.loadSelectData();
  }

  async loadSelectData() {
    try {
      const [pData, tData] = await Promise.all([
        this.proyectosService.getProyectos(),
        this.trabajadoresService.getTrabajadores()
      ]);
      this.proyectos.set(this.isEdit() ? pData : pData.filter(p => p.estatus === 'activo'));
      this.trabajadores.set(this.isEdit() ? tData : tData.filter(t => t.estatus === 'activo'));
    } catch (err: any) {
      this.snackBar.open('Error cargando listas: ' + err.message, 'Cerrar', { duration: 3000 });
    }
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    try {
      const formValue = { ...this.form.value };
      formValue.fecha = (formValue.fecha as Date).toISOString().split('T')[0];
      
      // If trabajador is empty string, make it null
      if (!formValue.trabajador_id) {
        formValue.trabajador_id = null;
      }

      if (this.isEdit()) {
        await this.gastosService.updateGasto(this.data.gasto!.id!, formValue);
        this.snackBar.open('Gasto actualizado', 'Cerrar', { duration: 3000 });
      } else {
        await this.gastosService.createGasto(formValue);
        this.snackBar.open('Gasto creado', 'Cerrar', { duration: 3000 });
      }
      this.dialogRef.close(true);
    } catch (error: any) {
      this.snackBar.open('Error al guardar: ' + error.message, 'Cerrar', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }
}
