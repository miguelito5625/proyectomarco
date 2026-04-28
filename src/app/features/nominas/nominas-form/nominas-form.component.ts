import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Nomina, NominasService } from '../../../core/services/nominas.service';
import { Trabajador, TrabajadoresService } from '../../../core/services/trabajadores.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-nominas-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatCheckboxModule
  ],
  templateUrl: './nominas-form.component.html',
  styleUrls: ['./nominas-form.component.scss'],
  providers: [provideNativeDateAdapter()]
})
export class NominasFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private nominasService = inject(NominasService);
  private trabajadoresService = inject(TrabajadoresService);
  private snackBar = inject(MatSnackBar);
  public dialogRef = inject(MatDialogRef<NominasFormComponent>);
  public data: { nomina?: Nomina } = inject(MAT_DIALOG_DATA);

  form!: FormGroup;
  loading = signal(false);
  isEdit = signal(false);
  trabajadores = signal<Trabajador[]>([]);

  ngOnInit() {
    this.isEdit.set(!!this.data?.nomina);
    const n = this.data?.nomina;

    this.form = this.fb.group({
      trabajador_id: [n?.trabajador_id || '', Validators.required],
      fecha_inicio: [n?.fecha_inicio ? new Date(n.fecha_inicio + 'T12:00:00Z') : '', Validators.required],
      fecha_fin: [n?.fecha_fin ? new Date(n.fecha_fin + 'T12:00:00Z') : '', Validators.required],
      trabajo_sabado: [n?.trabajo_sabado || false],
      horas_regulares: [n?.horas_regulares || 0, Validators.required],
      horas_extra: [n?.horas_extra || 0],
      horas_permiso: [n?.horas_permiso || 0],
      monto_notas_extra: [n?.monto_notas_extra || 0],
      notas: [n?.notas || ''],
      total_pago: [n?.total_pago || 0, Validators.required]
    });

    this.loadSelectData();
  }

  async loadSelectData() {
    try {
      const tData = await this.trabajadoresService.getTrabajadores();
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
      formValue.fecha_inicio = (formValue.fecha_inicio as Date).toISOString().split('T')[0];
      formValue.fecha_fin = (formValue.fecha_fin as Date).toISOString().split('T')[0];

      if (this.isEdit()) {
        await this.nominasService.updateNomina(this.data.nomina!.id!, formValue);
        this.snackBar.open('Nómina actualizada', 'Cerrar', { duration: 3000 });
      } else {
        await this.nominasService.createNomina(formValue);
        this.snackBar.open('Nómina creada', 'Cerrar', { duration: 3000 });
      }
      this.dialogRef.close(true);
    } catch (error: any) {
      this.snackBar.open('Error al guardar: ' + error.message, 'Cerrar', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }
}
