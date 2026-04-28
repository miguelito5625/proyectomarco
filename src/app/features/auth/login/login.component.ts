import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = signal(false);
  hidePassword = signal(true);
  errorMessage = signal<string | null>(null);

  private supabase = inject(SupabaseService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    const { email, password } = this.loginForm.value;

    try {
      const { data, error } = await this.supabase.signIn(email, password);
      
      if (error) {
        const msg = error.message === 'Invalid login credentials' 
          ? 'Correo o contraseña incorrectos' 
          : 'Error al iniciar sesión: ' + error.message;
        this.errorMessage.set(msg);
        this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
      } else {
        this.router.navigate(['/home']);
      }
    } catch (err: any) {
      const msg = 'Ocurrió un error de red o de servidor';
      this.errorMessage.set(msg);
      this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }
}
