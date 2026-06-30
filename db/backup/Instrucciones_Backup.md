# Instrucciones de Backup y Restauración de Base de Datos

Este documento contiene los pasos para respaldar (backup) y restaurar la base de datos de PostgreSQL alojada en Supabase, basándose en la configuración del archivo `esquema_bd.sql`.

## Credenciales de Conexión

- **Host:** db.hlhfqfoqiaugdbictpky.supabase.co
- **Puerto:** 6543
- **Usuario:** postgres
- **Contraseña:** mariobross5625
- **Base de Datos:** postgres (por defecto en Supabase)

---

## 1. Realizar un Backup (Respaldo)

Para extraer un backup completo de la base de datos (estructura y datos), necesitas tener instalada la herramienta `pg_dump`. 

Dependiendo de tu terminal, ejecuta el comando correspondiente. Esto generará automáticamente un archivo con la fecha y hora actual (ej. `backup_2026-06-29_23-50-57.backup`):

**En PowerShell (Recomendado en Windows):**
```powershell
pg_dump -h db.hlhfqfoqiaugdbictpky.supabase.co -p 6543 -U postgres -d postgres -n public -F c -b -v -f "backup_$((Get-Date).ToString('yyyy-MM-dd_HH-mm-ss')).backup"
```

**En Bash (Git Bash, Linux, Mac):**
```bash
pg_dump -h db.hlhfqfoqiaugdbictpky.supabase.co -p 6543 -U postgres -d postgres -n public -F c -b -v -f "backup_$(date +%Y-%m-%d_%H-%M-%S).backup"
```

*(Te pedirá la contraseña: `mariobross5625`)*

**Explicación de los parámetros:**
- `-h`: Especifica el host de la base de datos.
- `-p`: El puerto de conexión.
- `-U`: El usuario de la base de datos.
- `-d`: El nombre de la base de datos (por defecto `postgres`).
- `-n public`: Extrae **solo el esquema "public"** (donde viven tus tablas de trabajadores, proyectos, nóminas, etc.). Esto evita que se descarguen tablas internas del sistema de Supabase (como `auth`, `storage`, etc.).
- `-F c`: Formato personalizado (custom), el cual es el más recomendado para poder restaurar posteriormente usando `pg_restore`.
- `-b`: Incluye objetos grandes (blobs).
- `-v`: Modo detallado (verbose) para ver el progreso.
- `-f`: Nombre del archivo de salida (el comando insertará dinámicamente la fecha y hora en el nombre).

---

## 2. Restaurar la Base de Datos

Si necesitas restaurar la base de datos desde un archivo `.backup` generado previamente usando el comando anterior, debes usar la herramienta `pg_restore`.

Ejecuta el siguiente comando:

```bash
pg_restore -h db.hlhfqfoqiaugdbictpky.supabase.co -p 6543 -U postgres -d postgres -v -O -x "backup_fecha.backup"
```

**Explicación de los parámetros:**
- `-O` (`--no-owner`): Evita restaurar los dueños originales de las tablas (crucial en Supabase para evitar errores de permisos).
- `-x` (`--no-privileges`): Evita restaurar los permisos/privilegios (también crucial para Supabase).
- El resto de parámetros son iguales a los de conexión.

> [!NOTE]
> Al restaurar, verás un error que dice: `ERROR: schema "public" already exists`. **Esto es normal y puedes ignorarlo**. Supabase ya tiene el esquema `public` creado, así que fallará esa línea, pero continuará restaurando todas tus tablas y datos sin problema.

### Restaurar SOLO LOS DATOS (Si usaste TRUNCATE)
Si tus tablas ya están creadas y vacías (porque usaste los comandos `TRUNCATE`), la forma más limpia y sin errores de restaurar es usar la bandera `-a` (`--data-only`). Esto evitará que intente crear tablas o esquemas y solo insertará la información:

```bash
pg_restore -h db.hlhfqfoqiaugdbictpky.supabase.co -p 6543 -U postgres -d postgres -a -v "backup_fecha.backup"
```

---

## 3. Hacer Backup Solo de la Estructura (Esquema)

Si solo necesitas el esquema (las tablas, vistas, etc.) sin los datos de los usuarios o registros, puedes ejecutar:

**En PowerShell:**
```powershell
pg_dump -h db.hlhfqfoqiaugdbictpky.supabase.co -p 6543 -U postgres -d postgres -n public -s -f "esquema_$((Get-Date).ToString('yyyy-MM-dd_HH-mm-ss')).sql"
```

**En Bash:**
```bash
pg_dump -h db.hlhfqfoqiaugdbictpky.supabase.co -p 6543 -U postgres -d postgres -n public -s -f "esquema_$(date +%Y-%m-%d_%H-%M-%S).sql"
```
- `-s`: Solo extrae el esquema de la base de datos, no los datos.

---

## 4. Vaciar la Base de Datos o Eliminarla (Opcional)

Dentro de `esquema_bd.sql` también se incluyen comandos para limpiar las tablas en caso de ser necesario, antes de hacer una restauración limpia:
```sql
TRUNCATE TABLE gastos_proyecto CASCADE;
TRUNCATE TABLE nominas CASCADE;
TRUNCATE TABLE registros_tiempo CASCADE;
TRUNCATE TABLE proyectos CASCADE;
TRUNCATE TABLE trabajadores CASCADE;
```
*(No es obligatorio ejecutarlos a menos que requieras limpiar la base de datos por completo)*
