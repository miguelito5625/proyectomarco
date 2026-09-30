# Reporte de Auditoría: Seguridad y Buenas Prácticas
**Proyecto:** proyectomarco  
**Fecha de Auditoría:** 30 de Septiembre de 2026  
**Alcance:** Frontend (Angular 21), Base de Datos (Supabase / PostgreSQL), CI/CD (GitHub Actions), Dependencias (npm) y Repositorio Git.  
**Estado General:** ⚠️ **CRÍTICO - Requiere acción inmediata en credenciales, políticas RLS y gestión de respaldos.**

---

## 📋 Resumen Ejecutivo

Se ha llevado a cabo una auditoría integral de código, arquitectura, configuración y seguridad del repositorio `proyectomarco`. La aplicación es un sistema de gestión empresarial enfocado en control de trabajadores, proyectos, registros de tiempo, nóminas, gastos y reportes financieros.

Aunque la aplicación cuenta con una estructura moderna basada en Angular 21 (Standalone Components, Signals) y Supabase, **se han identificado vulnerabilidades de severidad CRÍTICA y ALTA** que comprometen directamente la confidencialidad, integridad y disponibilidad de la información de la empresa (tarifas de pago, nóminas, datos personales y acceso a la base de datos).

### Matriz de Riesgo Detectada

| Nivel de Riesgo | Cantidad de Hallazgos | Áreas Afectadas | Impacto Potencial |
| :--- | :---: | :--- | :--- |
| 🔴 **CRÍTICO** | 4 | Base de datos, Credenciales, Git, RLS | Acceso total como superusuario a la BD, robo o borrado masivo de información empresarial y nóminas. |
| 🟠 **ALTO** | 5 | Dependencias (npm), Control de Acceso (RBAC), Autenticación, Borrado Frontend | Escalada de privilegios, denegación de servicio (DoS), fugas de memoria, borrado accidental. |
| 🟡 **MEDIO** | 6 | Arquitectura Frontend, Rendimiento, Cero Lazy Loading, Agregaciones en Cliente | Rendimiento degradado, bundles pesados, vulnerabilidad de datos en sesión/tránsito. |
| 🟢 **BAJO / MEJORA** | 5 | Calidad de Código, Cobertura de Tests, Tipado TypeScript, Headers HTTP | Mantenibilidad a largo plazo, bugs silenciosos en producción. |

---

## 🔴 1. Hallazgos Críticos de Seguridad

### 1.1. Credenciales de Superusuario de PostgreSQL Expuestas en Texto Plano
- **Severidad:** 🔴 **CRÍTICA (CVSS 9.8)**
- **Archivos Involucrados:**
  - `scratch/query.js` (Línea 16)
  - `db/backup/Instrucciones_Backup.md` (Línea 10 y 31)
  - `db/esquema_bd.sql` (Línea 5)
  - `.agents/skills/db_backup/SKILL.md` (Línea 18, 31, 36, etc.)
- **Descripción del Problema:**
  La contraseña maestra del usuario `postgres` (`mariobross5625`), junto con el host directo de Supabase (`db.hlhfqfoqiaugdbictpky.supabase.co`) y el puerto (5432 / 6543), se encuentran expuestos directamente en el código fuente y en la documentación técnica dentro del repositorio Git.
- **Impacto:**
  Cualquier persona con acceso al repositorio (o si este llega a ser público) puede conectarse como superusuario de PostgreSQL, eludir cualquier política de seguridad, descargar toda la base de datos, alterar registros o destruir las tablas con `DROP TABLE / TRUNCATE`.
- **Remediación Inmediata:**
  1. Cambiar inmediatamente la contraseña del usuario `postgres` en el panel de control de Supabase (*Project Settings -> Database -> Database Password*).
  2. Eliminar las credenciales de todos los archivos de texto y código.
  3. Utilizar variables de entorno del sistema (`PGPASSWORD`, `.env` excluido en `.gitignore`) para scripts administrativos.
  4. Purgar el historial de Git (usando `git-filter-repo` o BFG Repo-Cleaner) para que la contraseña anterior no quede en commits previos.

---

### 1.2. Volcados Reales de Base de Datos de Producción (Backups) Versionados en Git
- **Severidad:** 🔴 **CRÍTICA (CVSS 9.1 - Fuga de Datos PII)**
- **Archivos Involucrados:**
  - `db/backup/backup_2026-08-26_23-08-29.backup`
  - `db/backup/backup_2026-09-10_08-58-29.backup`
  - `db/backup/backup_2026-09-15_18-51-04.backup`
  - `db/backup/backup_2026-09-15_19-07-34.backup`
  - `db/backup/backup_2026-09-30_14-37-37.backup`
- **Descripción del Problema:**
  Los archivos `.backup` (volcados binarios de `pg_dump`) generados durante el ciclo de vida del proyecto contienen datos reales de los trabajadores, sus salarios, horas extras, proyectos, gastos de la empresa y montos de nóminas. Estos archivos están rastreados activamente por Git y se suben al repositorio remoto.
- **Impacto:**
  Violación directa de privacidad de datos (PII). Cualquier colaborador o servicio que clone el repositorio tiene una copia offline completa de las finanzas y personal de la empresa.
- **Remediación Inmediata:**
  1. Agregar `db/backup/*.backup` y `db/backup/*.sql` al archivo `.gitignore`.
  2. Ejecutar `git rm --cached db/backup/*.backup` para desvincularlos del control de versiones sin eliminarlos de tu disco local.
  3. Almacenar los backups en un almacenamiento cifrado y protegido (ej. AWS S3 con cifrado SSE-S3 o Azure Blob Storage con acceso restringido).

---

### 1.3. Políticas RLS (Row Level Security) Completamente Abiertas a Todo Autenticado
- **Severidad:** 🔴 **CRÍTICA (CVSS 8.8)**
- **Archivo Involucrado:**
  - `db/esquema_bd.sql` (Líneas 158-163)
- **Código Actual:**
  ```sql
  CREATE POLICY "Permitir todo a usuarios autenticados" ON trabajadores FOR ALL TO authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "Permitir todo a usuarios autenticados" ON proyectos FOR ALL TO authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "Permitir todo a usuarios autenticados" ON registros_tiempo FOR ALL TO authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "Permitir todo a usuarios autenticados" ON nominas FOR ALL TO authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "Permitir todo a usuarios autenticados" ON gastos_proyecto FOR ALL TO authenticated USING (true) WITH CHECK (true);
  ```
- **Descripción del Problema:**
  Aunque RLS está activado (`ENABLE ROW LEVEL SECURITY`), las políticas otorgan acceso irrestricto (`FOR ALL ... USING (true) WITH CHECK (true)`) a **cualquier usuario** que posea un token JWT emitido por el servicio de autenticación de Supabase.
- **Impacto:**
  No existe segregación de datos. Cualquier cuenta autenticada (incluso un empleado básico o alguien que cree una cuenta si el registro está abierto) tiene permisos absolutos de `SELECT`, `INSERT`, `UPDATE` y `DELETE` en todas las tablas del sistema.

---

### 1.4. Riesgo de Auto-Registro Público en Supabase (Public Sign-up)
- **Severidad:** 🔴 **CRÍTICA**
- **Archivos Involucrados:**
  - `src/environments/environment.ts`
  - `src/app/core/services/supabase.service.ts` (Línea 45)
- **Descripción del Problema:**
  Las aplicaciones frontend basadas en Supabase exponen legítimamente `supabaseUrl` y `supabaseKey` (anon key) en el cliente. Sin embargo, en la configuración predeterminada de Supabase Auth, la opción **"Enable Email Signup"** está activa.
- **Impacto:**
  Un atacante externo puede enviar una petición `POST` al endpoint `/auth/v1/signup` de tu proyecto con cualquier correo y contraseña. Al obtener una sesión válida de Supabase, combinada con la política RLS abierta del punto 1.3, el atacante obtiene control total de lectura y borrado sobre la base de datos sin necesitar credenciales corporativas.
- **Remediación Inmediata:**
  1. En el panel de Supabase: ir a *Authentication -> Providers -> Email* y desactivar **"Enable Signups"** (o activar *Invite only*). De este modo, únicamente los administradores podrán crear nuevos usuarios.
  2. Implementar Roles en Supabase (ej. `role = 'admin'` en `auth.users.raw_app_meta_data` o una tabla `perfiles_usuario`) y condicionar las políticas RLS a dicho rol.

---

## 🟠 2. Hallazgos de Severidad Alta

### 2.1. Funcionalidad de Restauración en Frontend con Capacidad de Borrado Masivo Directo
- **Severidad:** 🟠 **ALTA**
- **Archivo Involucrado:**
  - `src/app/core/services/backup.service.ts` (Líneas 329-371)
- **Código Actual:**
  ```typescript
  // Borrado masivo sin filtro ejecutado directamente desde el cliente browser
  await this.supabase.from('gastos_proyecto').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await this.supabase.from('nominas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await this.supabase.from('registros_tiempo').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await this.supabase.from('proyectos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await this.supabase.from('trabajadores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  ```
- **Descripción:**
  El servicio de restauración `BackupService` ejecuta sentencias de eliminación total de todas las tablas desde el cliente Angular.
- **Impacto:**
  1. Si la conexión de red falla a mitad del proceso, la base de datos queda vaciada o en un estado de inconsistencia irrecuperable.
  2. Cualquier usuario con acceso a la interfaz `/backup` puede destruir toda la información de la empresa sin requerir contraseña de confirmación ni doble factor (2FA).
- **Recomendación:**
  - La importación y restauración de datos a gran escala no debe ejecutarse tabla por tabla en el navegador. Debe delegarse a una función segura de PostgreSQL (`SECURITY DEFINER` con transacción `BEGIN ... COMMIT`) o realizarse mediante scripts administrativos del lado del servidor.
  - Proteger la ruta `/backup` con un guard de rol de Administrador.

---

### 2.2. Validación de Sesión Insegura en `authGuard` (`getSession()` vs `getUser()`)
- **Severidad:** 🟠 **ALTA**
- **Archivo Involucrado:**
  - `src/app/core/guards/auth.guard.ts` (Línea 10)
- **Código Actual:**
  ```typescript
  const { data: { session } } = await supabaseService.client.auth.getSession();
  if (session) { return true; }
  ```
- **Descripción:**
  `auth.getSession()` únicamente verifica si existe un token en el almacenamiento local del navegador (`localStorage`), **sin verificar** con el servidor de Supabase si el token ha sido revocado, expirado forzosamente o si el usuario ha sido desactivado/eliminado.
- **Recomendación:**
  Utilizar `auth.getUser()`, el cual valida criptográficamente la sesión contra el servidor de autenticación:
  ```typescript
  const { data: { user }, error } = await supabaseService.client.auth.getUser();
  if (user && !error) {
    return true;
  }
  return router.parseUrl('/login');
  ```

---

### 2.3. Vulnerabilidades Críticas y Altas en el Árbol de Dependencias (`npm audit`)
- **Severidad:** 🟠 **ALTA (1 Crítica, 20 Altas, 12 Moderadas)**
- **Detalle de Auditoría:**
  - `tar` (<= 7.5.20): **Crítica** - File smuggling / manipulación de rutas en descompresión.
  - `piscina` (5.0.0 - 5.1.4): **Alta** - Prototype Pollution Gadget que conduce a RCE (Remote Code Execution).
  - `undici` (<= 6.28.0): **Alta** - Múltiples vulnerabilidades de CRLF Injection, envenenamiento de colas HTTP y bypass de validación TLS.
  - `postcss` (<= 8.5.22): **Alta** - Path traversal en carga automática de mapas de origen.
  - `vite` (7.0.0 - 7.3.3): **Alta** - Fuga de hashes NTLMv2 y bypass de filtros de archivo en Windows.
  - `ws` (8.0.0 - 8.20.1): **Alta** - Divulgación de memoria no inicializada y DoS por agotamiento de memoria.
- **Recomendación:**
  Ejecutar la actualización de dependencias de compilación y parches de seguridad:
  ```bash
  npm audit fix
  ```

---

### 2.4. Inclusión de Dependencia de Servidor (`pg`) en Paquete de Cliente Web
- **Severidad:** 🟠 **ALTA (Arquitectura / Riesgo de Empaquetado)**
- **Archivo Involucrado:**
  - `package.json` (Línea 24: `"pg": "^8.22.0"`)
- **Descripción:**
  `pg` (node-postgres) es un cliente para Node.js destinado a ejecutarse en servidores o scripts de consola (utilizado en `scratch/query.js`). No está diseñado para aplicaciones frontend de navegador. Mantenerlo en las dependencias de producción infla el árbol de módulos e introduce subdependencias innecesarias de bajo nivel de Node (`pg-types`, `pgpass`, `pg-pool`).
- **Recomendación:**
  Mover `pg` a `devDependencies` o mantener los scripts de consola en un paquete de utilidades separado.

---

### 2.5. Cálculo de Montos Críticos (`total_pago`) en el Cliente sin Validación en BD
- **Severidad:** 🟠 **ALTA**
- **Archivo Involucrado:**
  - `src/app/features/nominas/nominas-form/nominas-form.component.ts` (Línea 53)
  - `db/esquema_bd.sql` (Línea 80)
- **Descripción:**
  El campo `total_pago` de la tabla `nominas` se envía directamente desde el formulario web hacia la base de datos sin una columna calculada (`GENERATED ALWAYS AS ... STORED`), ni un trigger en PostgreSQL, ni restricciones `CHECK` que verifiquen la coherencia matemática entre las horas trabajadas, tarifas y adelantos.
- **Impacto:**
  Cualquier alteración maliciosa en el payload de la petición HTTP permite guardar pagos arbitrarios en las nóminas que no coinciden con las horas reales.
- **Recomendación:**
  Implementar una función trigger en PostgreSQL `BEFORE INSERT OR UPDATE` sobre la tabla `nominas` para validar o auto-calcular el campo `total_pago` de forma inmutable en el backend.

---

## 🟡 3. Hallazgos de Severidad Media y Rendimiento

### 3.1. Cero Lazy Loading en Rutas (Enrutamiento Monolítico)
- **Severidad:** 🟡 **MEDIA**
- **Archivo Involucrado:**
  - `src/app/app.routes.ts` (Líneas 1-13)
- **Descripción:**
  Todos los componentes de la aplicación (`LoginComponent`, `HomeComponent`, `TrabajadoresListComponent`, `ProyectosListComponent`, `BackupComponent`, reportes y diálogos) están importados estáticamente en la cabecera de `app.routes.ts`.
- **Impacto:**
  El usuario que simplemente entra a la pantalla de login se ve obligado a descargar todo el JavaScript de reportes, tablas complejas y el módulo de backup. Esto incrementa significativamente el First Contentful Paint (FCP) y el peso del bundle inicial.
- **Recomendación:**
  Migrar a enrutamiento diferido con `loadComponent`:
  ```typescript
  {
    path: 'reporte-costo-labor',
    loadComponent: () => import('./features/reportes/costo-labor/costo-labor.component')
      .then(m => m.CostoLaborComponent)
  }
  ```

---

### 3.2. Fugas de Memoria por Subscripciones RxJS no Destruidas
- **Severidad:** 🟡 **MEDIA**
- **Archivos Involucrados:**
  - `src/app/features/registros-tiempo/registros-tiempo-list/registros-tiempo-list.component.ts` (Líneas 72-74)
  - `src/app/features/reportes/costo-labor/costo-labor.component.ts` (Línea 64)
  - `src/app/features/reportes/horas-trabajador/horas-trabajador.component.ts` (Línea 71)
- **Descripción:**
  Se utilizan subscripciones manuales a los eventos de formularios reactivos (`valueChanges.subscribe(...)`) sin implementar el operador `takeUntilDestroyed()` de Angular ni guardar la suscripción para ejecutar `.unsubscribe()` en el ciclo `ngOnDestroy`.
- **Impacto:**
  Cada vez que el usuario navega a otra pantalla y regresa a estas vistas, se crea una nueva suscripción en memoria que nunca se recolecta por el Garbage Collector, provocando consumo acumulativo de memoria RAM y ejecuciones duplicadas de lógica de filtrado.
- **Recomendación:**
  Utilizar `takeUntilDestroyed()` en el contexto de inyección:
  ```typescript
  import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

  this.selectedTrabajadorId.valueChanges
    .pipe(takeUntilDestroyed())
    .subscribe(() => this.onFilterChange());
  ```

---

### 3.3. Agregaciones y Filtrado Pesado Realizado en Memoria del Navegador
- **Severidad:** 🟡 **MEDIA**
- **Archivos Involucrados:**
  - `src/app/core/services/reportes.service.ts` (Líneas 92-230)
  - `src/app/core/services/dashboard.service.ts` (Líneas 65-180)
- **Descripción:**
  Para calcular el costo de labor o las horas por trabajador, la aplicación descarga miles de registros desde Supabase en bloques de 1,000 filas y ejecuta bucles `while`, `map`, `reduce` y cálculos de fechas dentro del motor JavaScript del navegador.
- **Impacto:**
  A medida que la empresa acumule meses de registros, el navegador consumirá gran cantidad de memoria, la interfaz se congelará durante los cálculos y se transferirán megabytes innecesarios por la red.
- **Recomendación:**
  Crear vistas SQL o funciones almacenadas (RPC) en PostgreSQL / Supabase para que el motor de la base de datos entregue únicamente las filas ya agregadas y resumidas:
  ```sql
  -- Ejemplo de función RPC que devuelve solo el resumen calculado
  CREATE OR REPLACE FUNCTION get_resumen_costo_labor(p_fecha_inicio DATE, p_fecha_fin DATE)
  RETURNS TABLE (proyecto_id UUID, proyecto_nombre VARCHAR, costo_labor DECIMAL) AS $$
  ...
  $$ LANGUAGE sql SECURITY DEFINER;
  ```

---

### 3.4. Ausencia de Estrategia `ChangeDetectionStrategy.OnPush`
- **Severidad:** 🟡 **MEDIA**
- **Alcance:** Todos los componentes en `src/app/features/`
- **Descripción:**
  Ningún componente declara `changeDetection: ChangeDetectionStrategy.OnPush`. Por defecto, Angular evalúa cada binding de la plantilla en cada tick del ciclo de vida (eventos de mouse, respuestas HTTP, temporizadores).
- **Recomendación:**
  Configurar `changeDetection: ChangeDetectionStrategy.OnPush` en componentes que ya utilizan Signals o datos inmutables para reducir drásticamente el uso de CPU.

---

### 3.5. Violación de Abstracción: Componentes Consultando Directamente el Cliente de Supabase
- **Severidad:** 🟡 **MEDIA (Arquitectura Limpia)**
- **Archivos Involucrados:**
  - `src/app/features/registros-tiempo/registros-tiempo-list/registros-tiempo-list.component.ts` (Línea 31 y 168)
  - `src/app/core/guards/auth.guard.ts` y `no-auth.guard.ts`
- **Descripción:**
  Los componentes inyectan `SupabaseService.client` directamente para ejecutar `.from('registros_tiempo').select(...)` o llamadas directas de base de datos, saltándose la capa de servicio (`RegistrosTiempoService`).
- **Recomendación:**
  Centralizar todas las operaciones de persistencia en los servicios dedicados de Angular, manteniendo a los componentes como controladores puros de presentación.

---

### 3.6. Almacenamiento de Estados y Datos de Negocio en `sessionStorage`
- **Severidad:** 🟡 **MEDIA**
- **Archivo Involucrado:**
  - `src/app/core/services/reportes.service.ts` (Líneas 58 y 71)
- **Descripción:**
  Se serializa el estado completo de filtros y datos de costo de labor en `sessionStorage.setItem('costo_labor_state', ...)`.
- **Riesgo:**
  Cualquier script que logre ejecutarse en el contexto del navegador (XSS) puede leer datos financieros en claro desde `sessionStorage`.
- **Recomendación:**
  Manejar el estado de filtros mediante Query Parameters en la URL (`/reporte-costo-labor?desde=...&hasta=...`) o en servicios en memoria basados en Signals de Angular.

---

## 🟢 4. Hallazgos Menores y Buenas Prácticas

### 4.1. Uso Inseguro de `npm install` en Pipeline de CI/CD
- **Severidad:** 🟢 **BAJA (Seguridad en Pipeline)**
- **Archivo Involucrado:**
  - `.github/workflows/deploy.yml` (Línea 26)
- **Problema:** Se ejecuta `npm install` en el workflow de despliegue en lugar de `npm ci`. `npm install` puede alterar o ignorar resoluciones estrictas de `package-lock.json` e instalar versiones menores con cambios no probados.
- **Solución:** Reemplazar por `npm ci`.

---

### 4.2. Falta de Cabeceras de Seguridad y Content Security Policy (CSP)
- **Severidad:** 🟢 **BAJA**
- **Archivo Involucrado:**
  - `src/index.html`
- **Problema:** No se definen meta tags de seguridad como `Content-Security-Policy`, `X-Content-Type-Options: nosniff` o `Referrer-Policy: strict-origin-when-cross-origin`.
- **Solución:** Agregar la política CSP básica y configurar las cabeceras en el servidor de hosting (o headers meta correspondientes en `index.html`).

---

### 4.3. Validación Débil de Contraseñas
- **Severidad:** 🟢 **BAJA**
- **Archivos Involucrados:**
  - `src/app/features/user/change-password-dialog/change-password-dialog.component.ts` (Línea 58)
  - `src/app/features/auth/login/login.component.ts` (Línea 43)
- **Problema:** La validación solo exige `Validators.minLength(6)`. Permite contraseñas vulnerables como `123456` o `aaaaaa`.
- **Solución:** Exigir mínimo 8 o 10 caracteres con expresión regular que obligue al menos una mayúscula, un número y un símbolo.

---

### 4.4. Uso Extensivo de `any` en TypeScript
- **Severidad:** 🟢 **BAJA (Calidad de Código)**
- **Alcance:** Detectadas más de 60 ocurrencias de `: any` en servicios y componentes.
- **Problema:** Desactiva la comprobación estricta de tipos de TypeScript, lo que oculta errores en tiempo de compilación y propicia excepciones `TypeError: Cannot read properties of undefined` en tiempo de ejecución.
- **Solución:** Definir interfaces formales para todos los tipos de respuesta y usar `unknown` en bloques `catch(err: unknown)`.

---

### 4.5. Cobertura de Pruebas Unitarias Casi Nula
- **Severidad:** 🟢 **BAJA**
- **Alcance:** Solo 2 archivos de prueba (`app.spec.ts` y `costo-labor-desglose.spec.ts`).
- **Problema:** Cálculos críticos de dinero, nóminas semanales y horas extras carecen de tests automatizados que verifiquen que una modificación futura no rompa la lógica matemática.
- **Solución:** Implementar suites de pruebas unitarias con Vitest sobre `ReportesService` y `NominasService`.

---

## 🛠️ Plan de Remediación Paso a Paso (Recomendado)

### Fase 1: Blindaje Inmediato (Primeras 24 horas)
1. **Rotación de Contraseñas:** Cambiar la clave del usuario `postgres` en el panel de Supabase.
2. **Exclusión de Secretos en Git:**
   - Añadir a `.gitignore`:
     ```gitignore
     # Credenciales y bases de datos
     db/backup/*.backup
     db/backup/*.sql
     scratch/
     .env
     ```
   - Desindexar los backups de git:
     ```bash
     git rm --cached db/backup/*.backup
     ```
3. **Cerrar Registro Público en Supabase:** Desactivar "Enable Email Signup" en la consola de Supabase.
4. **Corregir `authGuard`:** Reemplazar `getSession()` por `getUser()`.

### Fase 2: Robustecimiento de Base de Datos y RLS (Semana 1)
1. **Implementar Roles (RBAC):** Crear tabla o claim `user_roles` (`admin`, `supervisor`, `operador`).
2. **Restringir RLS:** Modificar las políticas de `db/esquema_bd.sql` para que solo usuarios con rol administrativo puedan borrar o modificar nóminas y tarifas de pago.
3. **Integridad de Nóminas:** Crear un trigger en PostgreSQL que valide que el cálculo de `total_pago` sea exacto antes de permitir el guardado.

### Fase 3: Modernización y Rendimiento Frontend (Semana 2)
1. **Lazy Loading:** Configurar `loadComponent` en todas las rutas secundarias de `app.routes.ts`.
2. **Prevención de Memory Leaks:** Aplicar `takeUntilDestroyed()` a todos los `valueChanges.subscribe(...)`.
3. **Optimización de Reportes:** Reemplazar la paginación client-side de 1,000 en 1,000 por una vista SQL o RPC que calcule los agregados en PostgreSQL.
4. **Dependencias:** Ejecutar `npm audit fix` y trasladar `pg` a `devDependencies`.

---

*Reporte generado automáticamente como parte de la auditoría de seguridad y calidad arquitectónica.*
