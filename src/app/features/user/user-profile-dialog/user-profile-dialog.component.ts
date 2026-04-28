import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SupabaseService } from '../../../core/services/supabase.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-profile-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, 
    MatFormFieldModule, MatInputModule
  ],
  templateUrl: './user-profile-dialog.component.html',
  styleUrls: ['./user-profile-dialog.component.scss']
})
export class UserProfileDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);
  private snackBar = inject(MatSnackBar);
  public dialogRef = inject(MatDialogRef<UserProfileDialogComponent>);

  form!: FormGroup;
  loading = signal(false);

  ngOnInit() {
    const user = this.supabase.currentUserValue;
    
    this.form = this.fb.group({
      email: [{value: user?.email || '', disabled: true}],
      displayName: [user?.user_metadata?.['display_name'] || '', Validators.required],
      phone: [user?.phone || '']
    });
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    const { displayName, phone } = this.form.value;

    try {
      const { error } = await this.supabase.updateUser({
        phone: phone || null,
        data: { display_name: displayName }
      });
      
      if (error) {
        this.snackBar.open('Error al guardar: ' + error.message, 'Cerrar', { duration: 5000 });
      } else {
        this.snackBar.open('Información guardada exitosamente', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      }
    } catch (err: any) {
      this.snackBar.open('Ocurrió un error inesperado.', 'Cerrar', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }
}
