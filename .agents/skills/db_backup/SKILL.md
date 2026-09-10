---
name: db_backup
description: Procedimientos y comandos para realizar y restaurar respaldos (backups) de la base de datos PostgreSQL en Supabase. Activar ÚNICAMENTE cuando el usuario solicite explícitamente realizar un backup o respaldo de la base de datos (o cuando se requiera restaurar un respaldo).
---
# Skill: Respaldo y Restauración de Base de Datos (db_backup)

Esta skill proporciona los comandos y procedimientos exactos para realizar y restaurar respaldos (backups) de la base de datos PostgreSQL alojada en Supabase, basándose en la configuración de `db/backup/Instrucciones_Backup.md`.

## Condición de Activación
- **Activación Exclusiva:** Esta skill debe ejecutarse **únicamente** cuando el usuario solicite de forma explícita hacer un backup, respaldo o restauración de la base de datos (o cuando sea mandatorio realizar un respaldo previo a cambios estructurales según las reglas del proyecto). No ejecutar en consultas ordinarias de código.

---

## Credenciales y Configuración de Conexión
- **Host:** `db.hlhfqfoqiaugdbictpky.supabase.co`
- **Puerto:** `6543`
- **Usuario:** `postgres`
- **Contraseña:** `mariobross5625`
- **Base de Datos:** `postgres`
- **Directorio de Respaldos:** `db/backup/`

---

## Procedimientos de Ejecución

### 1. Backup Completo (Esquema y Datos) - Recomendado
Genera un respaldo íntegro de las tablas de datos y su estructura en formato personalizado comprimido (`.backup`).

**Comando en PowerShell (Windows):**
```powershell
$env:PGPASSWORD="mariobross5625"; pg_dump -h db.hlhfqfoqiaugdbictpky.supabase.co -p 6543 -U postgres -d postgres -n public -F c -b -v -f "db/backup/backup_$((Get-Date).ToString('yyyy-MM-dd_HH-mm-ss')).backup"
```

**Comando en Bash (Linux/Mac/Git Bash):**
```bash
PGPASSWORD="mariobross5625" pg_dump -h db.hlhfqfoqiaugdbictpky.supabase.co -p 6543 -U postgres -d postgres -n public -F c -b -v -f "db/backup/backup_$(date +%Y-%m-%d_%H-%M-%S).backup"
```

**Detalle de Parámetros:**
- `$env:PGPASSWORD="mariobross5625"`: Inyecta la contraseña en la sesión de terminal para evitar que el comando se quede esperando input interactivo.
- `-h db.hlhfqfoqiaugdbictpky.supabase.co -p 6543`: Host y puerto del pooler de Supabase.
- `-U postgres -d postgres`: Usuario y base de datos principal.
- `-n public`: Extrae exclusivamente el esquema `public` (tablas de negocio: `trabajadores`, `proyectos`, `nominas`, `registros_tiempo`, `gastos_proyecto`, etc.), evitando tablas internas de Supabase (`auth`, `storage`, etc.).
- `-F c`: Formato custom (comprimido y flexible para usar con `pg_restore`).
- `-b`: Incluye large objects (blobs).
- `-v`: Modo verbose (muestra progreso).
- `-f "db/backup/backup_...backup"`: Ruta de salida en la carpeta de respaldos con timestamp.

---

### 2. Backup Solo de Estructura (Esquema SQL sin datos)
Si solo se requiere la definición de tablas, vistas y restricciones:

**Comando en PowerShell:**
```powershell
$env:PGPASSWORD="mariobross5625"; pg_dump -h db.hlhfqfoqiaugdbictpky.supabase.co -p 6543 -U postgres -d postgres -n public -s -f "db/backup/esquema_$((Get-Date).ToString('yyyy-MM-dd_HH-mm-ss')).sql"
```

---

### 3. Restauración de Base de Datos
Para restaurar un archivo `.backup` generado previamente:

**Comando en PowerShell:**
```powershell
$env:PGPASSWORD="mariobross5625"; pg_restore -h db.hlhfqfoqiaugdbictpky.supabase.co -p 6543 -U postgres -d postgres -v -O -x "db/backup/<NOMBRE_DEL_ARCHIVO>.backup"
```

**Notas críticas de restauración:**
- `-O` (`--no-owner`): No intenta restaurar los dueños originales de las tablas (obligatorio en Supabase para evitar errores de permisos).
- `-x` (`--no-privileges`): Evita restaurar privilegios/permisos especiales.
- *Nota sobre error común:* El mensaje `ERROR: schema "public" already exists` es normal en Supabase y se puede ignorar sin problemas.

---

### 4. Restauración Solo de Datos (Tablas ya existentes y limpias)
Si las tablas ya existen (ej. tras ejecutar `TRUNCATE TABLE ... CASCADE;`):

```powershell
$env:PGPASSWORD="mariobross5625"; pg_restore -h db.hlhfqfoqiaugdbictpky.supabase.co -p 6543 -U postgres -d postgres -a -v "db/backup/<NOMBRE_DEL_ARCHIVO>.backup"
```
- `-a`: Solo restaura los datos, sin intentar crear tablas ni alterar esquemas.

---

## Pasos de Verificación tras el Backup
1. Verificar que el archivo generado existe en `db/backup/`.
2. Confirmar que su tamaño sea mayor a 0 KB (ej. típicamente > 50-100 KB para datos reales).
3. Reportar al usuario el nombre del archivo generado, ruta completa y tamaño en disco.
