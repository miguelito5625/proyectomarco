import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorStateMatcher } from '@angular/material/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { CommonModule } from '@angular/common';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    return { 'passwordMismatch': true };
  }
  return null;
}

export class ConfirmPasswordMatcher implements ErrorStateMatcher {
  isErrorState(control: AbstractControl | null, form: import('@angular/forms').FormGroupDirective | import('@angular/forms').NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted)) || 
           !!(control && control.parent?.hasError('passwordMismatch') && (control.dirty || control.touched));
  }
}

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, 
    MatFormFieldModule, MatInputModule, MatIconModule
  ],
  templateUrl: './change-password-dialog.component.html',
  styleUrls: ['./change-password-dialog.component.scss']
})
export class ChangePasswordDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);
  private snackBar = inject(MatSnackBar);
  public dialogRef = inject(MatDialogRef<ChangePasswordDialogComponent>);

  form!: FormGroup;
  loading = signal(false);
  hideOld = signal(true);
  hideNew = signal(true);
  hideConfirm = signal(true);
  errorMessage = signal<string | null>(null);
  
  matcher = new ConfirmPasswordMatcher();

  ngOnInit() {
    this.form = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    const { oldPassword, newPassword } = this.form.value;
    const currentUser = this.supabase.currentUserValue;

    if (!currentUser?.email) {
      this.errorMessage.set('No se pudo identificar el usuario actual.');
      this.loading.set(false);
      return;
    }

    try {
      // Verificar contraseña actual intentando hacer login
      const { error: signInError } = await this.supabase.signIn(currentUser.email, oldPassword);
      if (signInError) {
        this.errorMessage.set('La contraseña anterior es incorrecta.');
        this.loading.set(false);
        return;
      }

      // Si es correcta, actualizar el password
      const { error: updateError } = await this.supabase.updateUser({ password: newPassword });
      
      if (updateError) {
        this.errorMessage.set('Error al actualizar: ' + updateError.message);
      } else {
        this.snackBar.open('Contraseña cambiada exitosamente', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      }
    } catch (err: any) {
      this.errorMessage.set('Ocurrió un error inesperado al cambiar la contraseña.');
    } finally {
      this.loading.set(false);
    }
  }
}
