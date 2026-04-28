import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { Trabajador, TrabajadoresService } from '../../../core/services/trabajadores.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-trabajadores-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './trabajadores-form.component.html',
  styleUrls: ['./trabajadores-form.component.scss']
})
export class TrabajadoresFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private trabajadoresService = inject(TrabajadoresService);
  private snackBar = inject(MatSnackBar);
  public dialogRef = inject(MatDialogRef<TrabajadoresFormComponent>);
  public data: { trabajador?: Trabajador } = inject(MAT_DIALOG_DATA);

  form!: FormGroup;
  loading = signal(false);
  isEdit = signal(false);

  ngOnInit() {
    this.isEdit.set(!!this.data?.trabajador);
    const t = this.data?.trabajador;

    this.form = this.fb.group({
      nombre: [t?.nombre || '', Validators.required],
      pago_hora_regular: [t?.pago_hora_regular || 0, [Validators.required, Validators.min(0)]],
      pago_hora_extra: [t?.pago_hora_extra || 0, [Validators.required, Validators.min(0)]],
      pago_sabado: [t?.pago_sabado || 0, [Validators.required, Validators.min(0)]],
      estatus: [t?.estatus || 'activo', Validators.required]
    });
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    try {
      if (this.isEdit()) {
        await this.trabajadoresService.updateTrabajador(this.data.trabajador!.id!, this.form.value);
        this.snackBar.open('Trabajador actualizado con éxito', 'Cerrar', { duration: 3000 });
      } else {
        await this.trabajadoresService.createTrabajador(this.form.value);
        this.snackBar.open('Trabajador creado con éxito', 'Cerrar', { duration: 3000 });
      }
      this.dialogRef.close(true);
    } catch (error: any) {
      this.snackBar.open('Error al guardar: ' + error.message, 'Cerrar', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }
}
