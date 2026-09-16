import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BackupService, TableStats, BackupData } from '../../core/services/backup.service';

@Component({
  selector: 'app-backup',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './backup.component.html',
  styleUrls: ['./backup.component.scss']
})
export class BackupComponent implements OnInit {
  public backupService = inject(BackupService);
  private snackBar = inject(MatSnackBar);

  // Estados locales
  stats = signal<TableStats | null>(null);
  loadingStats = signal<boolean>(false);

  // Estados de exportación
  isExporting = signal<boolean>(false);
  lastExportedFile = signal<{ filename: string; stats: TableStats; sizeKb: number } | null>(null);

  // Estados de importación / restauración
  selectedFile = signal<File | null>(null);
  selectedBackupData = signal<BackupData | null>(null);
  fileValidationError = signal<string | null>(null);
  isRestoring = signal<boolean>(false);
  showRestoreConfirm = signal<boolean>(false);
  lastRestoredStats = signal<TableStats | null>(null);

  ngOnInit() {
    this.loadStats();
  }

  async loadStats() {
    this.loadingStats.set(true);
    try {
      const data = await this.backupService.getDatabaseStats();
      this.stats.set(data);
    } catch (err: any) {
      this.snackBar.open('Error al obtener estadísticas: ' + (err.message || err), 'Cerrar', { duration: 4000 });
    } finally {
      this.loadingStats.set(false);
    }
  }

  async startExport() {
    if (this.isExporting() || this.isRestoring()) return;

    this.isExporting.set(true);
    this.lastExportedFile.set(null);

    try {
      const result = await this.backupService.exportBackup();
      this.lastExportedFile.set(result);
      this.snackBar.open(`¡Copia descargada con éxito! (${result.filename})`, 'Aceptar', {
        duration: 5000,
        panelClass: ['success-snackbar']
      });
    } catch (err: any) {
      this.snackBar.open('Error al generar respaldo: ' + (err.message || err), 'Cerrar', { duration: 6000 });
    } finally {
      this.isExporting.set(false);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.processFile(file);
    // Limpiar input para permitir seleccionar el mismo archivo si es necesario
    input.value = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.processFile(file);
    }
  }

  private processFile(file: File) {
    this.fileValidationError.set(null);
    this.selectedBackupData.set(null);
    this.showRestoreConfirm.set(false);

    if (!file.name.toLowerCase().endsWith('.json')) {
      this.fileValidationError.set('El archivo seleccionado debe ser de tipo JSON (.json).');
      this.selectedFile.set(null);
      return;
    }

    this.selectedFile.set(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const validation = this.backupService.validateBackupJson(content);
      if (!validation.valid || !validation.backup) {
        this.fileValidationError.set(validation.error || 'El archivo JSON no tiene la estructura esperada.');
        this.selectedBackupData.set(null);
      } else {
        this.selectedBackupData.set(validation.backup);
      }
    };
    reader.onerror = () => {
      this.fileValidationError.set('Error al leer el archivo en el navegador.');
    };
    reader.readAsText(file);
  }

  cancelRestore() {
    this.selectedFile.set(null);
    this.selectedBackupData.set(null);
    this.fileValidationError.set(null);
    this.showRestoreConfirm.set(false);
  }

  requestRestoreConfirmation() {
    this.showRestoreConfirm.set(true);
  }

  async executeRestore() {
    const backup = this.selectedBackupData();
    if (!backup || this.isRestoring() || this.isExporting()) return;

    this.isRestoring.set(true);
    this.showRestoreConfirm.set(false);
    this.lastRestoredStats.set(null);

    try {
      const restored = await this.backupService.restoreFromBackup(backup);
      this.lastRestoredStats.set(restored);
      this.snackBar.open('¡Restauración completada con éxito!', 'Cerrar', { duration: 5000 });
      await this.loadStats();
    } catch (err: any) {
      this.snackBar.open('Fallo al restaurar: ' + (err.message || err), 'Cerrar', { duration: 8000 });
    } finally {
      this.isRestoring.set(false);
    }
  }
}
