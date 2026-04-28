import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { RegistroTiempo, RegistrosTiempoService } from '../../../core/services/registros-tiempo.service';
import { Proyecto, ProyectosService } from '../../../core/services/proyectos.service';
import { Trabajador, TrabajadoresService } from '../../../core/services/trabajadores.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-registros-tiempo-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule
  ],
  templateUrl: './registros-tiempo-form.component.html',
  styleUrls: ['./registros-tiempo-form.component.scss']
})
export class RegistrosTiempoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private registrosService = inject(RegistrosTiempoService);
  private proyectosService = inject(ProyectosService);
  private trabajadoresService = inject(TrabajadoresService);
  private snackBar = inject(MatSnackBar);
  public dialogRef = inject(MatDialogRef<RegistrosTiempoFormComponent>);
  public data: { registro?: RegistroTiempo } = inject(MAT_DIALOG_DATA);

  form!: FormGroup;
  loading = signal(false);
  isEdit = signal(false);

  trabajadores = signal<Trabajador[]>([]);
  proyectos = signal<Proyecto[]>([]);

  ngOnInit() {
    this.isEdit.set(!!this.data?.registro);
    const r = this.data?.registro;

    this.form = this.fb.group({
      trabajador_id: [r?.trabajador_id || '', Validators.required],
      proyecto_id: [r?.proyecto_id || '', Validators.required],
      fecha: [r?.fecha ? new Date(r.fecha + 'T12:00:00Z') : new Date(), Validators.required],
      horas: [r?.horas || 0, [Validators.required, Validators.min(0.5)]]
    });

    this.loadSelectData();
  }

  async loadSelectData() {
    try {
      const [tData, pData] = await Promise.all([
        this.trabajadoresService.getTrabajadores(),
        this.proyectosService.getProyectos()
      ]);
      // Filtrar solo activos para nuevos registros (si es edición mostramos todo por si acaso)
      this.trabajadores.set(this.isEdit() ? tData : tData.filter(t => t.estatus === 'activo'));
      this.proyectos.set(this.isEdit() ? pData : pData.filter(p => p.estatus === 'activo'));
    } catch (err: any) {
      this.snackBar.open('Error cargando listas: ' + err.message, 'Cerrar', { duration: 3000 });
    }
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    try {
      const formValue = { ...this.form.value };
      // Convertir fecha a string YYYY-MM-DD
      const date: Date = formValue.fecha;
      formValue.fecha = date.toISOString().split('T')[0];

      if (this.isEdit()) {
        await this.registrosService.updateRegistro(this.data.registro!.id!, formValue);
        this.snackBar.open('Registro actualizado', 'Cerrar', { duration: 3000 });
      } else {
        await this.registrosService.createRegistro(formValue);
        this.snackBar.open('Registro creado', 'Cerrar', { duration: 3000 });
      }
      this.dialogRef.close(true);
    } catch (error: any) {
      this.snackBar.open('Error al guardar: ' + error.message, 'Cerrar', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }
}
