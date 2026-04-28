import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Proyecto, ProyectosService } from '../../../core/services/proyectos.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-proyectos-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './proyectos-form.component.html',
  styleUrls: ['./proyectos-form.component.scss']
})
export class ProyectosFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private proyectosService = inject(ProyectosService);
  private snackBar = inject(MatSnackBar);
  public dialogRef = inject(MatDialogRef<ProyectosFormComponent>);
  public data: { proyecto?: Proyecto } = inject(MAT_DIALOG_DATA);

  form!: FormGroup;
  loading = signal(false);
  isEdit = signal(false);

  ngOnInit() {
    this.isEdit.set(!!this.data?.proyecto);
    const p = this.data?.proyecto;

    this.form = this.fb.group({
      nombre: [p?.nombre || '', Validators.required],
      direccion: [p?.direccion || ''],
      estatus: [p?.estatus || 'activo', Validators.required]
    });
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    try {
      if (this.isEdit()) {
        await this.proyectosService.updateProyecto(this.data.proyecto!.id!, this.form.value);
        this.snackBar.open('Proyecto actualizado con éxito', 'Cerrar', { duration: 3000 });
      } else {
        await this.proyectosService.createProyecto(this.form.value);
        this.snackBar.open('Proyecto creado con éxito', 'Cerrar', { duration: 3000 });
      }
      this.dialogRef.close(true);
    } catch (error: any) {
      this.snackBar.open('Error al guardar: ' + error.message, 'Cerrar', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }
}
