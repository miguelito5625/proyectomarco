# Graph Report - proyectomarco  (2026-09-15)

## Corpus Check
- 62 files · ~20,799 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 416 nodes · 606 edges · 31 communities (18 shown, 13 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0cec358b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- main-layout.component.ts
- ProyectosService
- dependencies
- development
- registros-tiempov2-list.component.ts
- devDependencies
- app.routes.ts
- gastos-form.component.ts
- NominasService
- TrabajadoresService
- HorasTrabajadorComponent
- Reglas de Proyecto: proyectomarco
- RegistrosTiempov2ListComponent
- CostoLaborComponent
- update_responsive.js
- fix_ts.js
- proyectomarco
- query.js
- rules/graphify.md
- workflows/graphify.md
- Procedimientos de Ejecución
- Instrucciones de Backup y Restauración de Base de Datos
- Proyectomarco
- auto_commiter/SKILL.md
- auto_compiler/SKILL.md
- prompt_enhancer/SKILL.md
- BackupService
- BackupComponent
- CostoLaborDesgloseComponent
- Injectable

## God Nodes (most connected - your core abstractions)
1. `SupabaseService` - 25 edges
2. `HorasTrabajadorComponent` - 17 edges
3. `RegistrosTiempov2ListComponent` - 16 edges
4. `ProyectosService` - 15 edges
5. `CostoLaborComponent` - 14 edges
6. `TrabajadoresService` - 14 edges
7. `BackupComponent` - 13 edges
8. `Proyecto` - 12 edges
9. `RegistrosTiempoListComponent` - 11 edges
10. `Trabajador` - 11 edges

## Surprising Connections (you probably didn't know these)
- `ProyectosFormComponent` --references--> `Proyecto`  [EXTRACTED]
  src/app/features/proyectos/proyectos-form/proyectos-form.component.ts → src/app/core/services/proyectos.service.ts
- `RegistrosTiempoFormComponent` --references--> `RegistroTiempo`  [EXTRACTED]
  src/app/features/registros-tiempo/registros-tiempo-form/registros-tiempo-form.component.ts → src/app/core/services/registros-tiempo.service.ts
- `GastosFormComponent` --references--> `GastoProyecto`  [EXTRACTED]
  src/app/features/gastos/gastos-form/gastos-form.component.ts → src/app/core/services/gastos.service.ts
- `NominasFormComponent` --references--> `Nomina`  [EXTRACTED]
  src/app/features/nominas/nominas-form/nominas-form.component.ts → src/app/core/services/nominas.service.ts
- `TrabajadoresFormComponent` --references--> `Trabajador`  [EXTRACTED]
  src/app/features/trabajadores/trabajadores-form/trabajadores-form.component.ts → src/app/core/services/trabajadores.service.ts

## Import Cycles
- None detected.

## Communities (31 total, 13 thin omitted)

### Community 0 - "main-layout.component.ts"
Cohesion: 0.07
Nodes (16): Inject, App, appConfig, routes, Component, AppTheme, ThemeService, Injectable (+8 more)

### Community 1 - "ProyectosService"
Cohesion: 0.10
Nodes (13): Injectable, Proyecto, ProyectosService, Injectable, CostoLabor, CostoLaborFilters, HorasTrabajador, HorasTrabajadorFilters (+5 more)

### Community 2 - "dependencies"
Cohesion: 0.07
Nodes (27): @angular/animations, @angular/cdk, @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/material, @angular/platform-browser (+19 more)

### Community 3 - "development"
Cohesion: 0.08
Nodes (27): build, serve, test, builder, configurations, defaultConfiguration, options, development (+19 more)

### Community 4 - "registros-tiempov2-list.component.ts"
Cohesion: 0.13
Nodes (7): RegistrosTiempoService, RegistroTiempo, Injectable, RegistrosTiempoFormComponent, Component, RegistrosTiempoListComponent, Component

### Community 5 - "devDependencies"
Cohesion: 0.08
Nodes (25): @angular/build, @angular/compiler-cli, jsdom, devDependencies, @angular/build, @angular/cli, @angular/compiler-cli, jsdom (+17 more)

### Community 6 - "app.routes.ts"
Cohesion: 0.11
Nodes (9): authGuard(), noAuthGuard(), SupabaseService, Injectable, LoginComponent, Component, HomeComponent, Component (+1 more)

### Community 7 - "gastos-form.component.ts"
Cohesion: 0.15
Nodes (7): GastoProyecto, GastosProyectoService, Injectable, GastosFormComponent, Component, GastosListComponent, Component

### Community 8 - "NominasService"
Cohesion: 0.15
Nodes (7): Nomina, NominasService, Injectable, NominasFormComponent, Component, NominasListComponent, Component

### Community 9 - "TrabajadoresService"
Cohesion: 0.14
Nodes (7): Trabajador, TrabajadoresService, Injectable, TrabajadoresFormComponent, Component, TrabajadoresListComponent, Component

### Community 14 - "update_responsive.js"
Cohesion: 0.33
Nodes (3): fs, path, srcDir

### Community 15 - "fix_ts.js"
Cohesion: 0.40
Nodes (3): fs, path, srcDir

### Community 16 - "proyectomarco"
Cohesion: 0.14
Nodes (13): analytics, packageManager, cli, newProjectRoot, projects, proyectomarco, prefix, projectType (+5 more)

### Community 21 - "Procedimientos de Ejecución"
Cohesion: 0.20
Nodes (9): 1. Backup Completo (Esquema y Datos) - Recomendado, 2. Backup Solo de Estructura (Esquema SQL sin datos), 3. Restauración de Base de Datos, 4. Restauración Solo de Datos (Tablas ya existentes y limpias), Condición de Activación, Credenciales y Configuración de Conexión, Pasos de Verificación tras el Backup, Procedimientos de Ejecución (+1 more)

### Community 22 - "Instrucciones de Backup y Restauración de Base de Datos"
Cohesion: 0.25
Nodes (7): 1. Realizar un Backup (Respaldo), 2. Restaurar la Base de Datos, 3. Hacer Backup Solo de la Estructura (Esquema), 4. Vaciar la Base de Datos o Eliminarla (Opcional), Credenciales de Conexión, Instrucciones de Backup y Restauración de Base de Datos, Restaurar SOLO LOS DATOS (Si usaste TRUNCATE)

### Community 23 - "Proyectomarco"
Cohesion: 0.25
Nodes (7): Additional Resources, Building, Code scaffolding, Development server, Proyectomarco, Running end-to-end tests, Running unit tests

### Community 27 - "BackupService"
Cohesion: 0.22
Nodes (5): BackupData, BackupService, ProgressState, TableStats, Injectable

## Knowledge Gaps
- **88 isolated node(s):** `ProgressState`, `Reglas de Base de Datos`, `fs`, `path`, `srcDir` (+83 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HorasTrabajadorComponent` connect `HorasTrabajadorComponent` to `ProyectosService`, `app.routes.ts`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `SupabaseService` connect `app.routes.ts` to `main-layout.component.ts`, `ProyectosService`, `registros-tiempov2-list.component.ts`, `gastos-form.component.ts`, `NominasService`, `TrabajadoresService`, `BackupService`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `RegistrosTiempov2ListComponent` connect `RegistrosTiempov2ListComponent` to `registros-tiempov2-list.component.ts`, `app.routes.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `ProgressState`, `Reglas de Base de Datos`, `fs` to the rest of the system?**
  _88 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `main-layout.component.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07112375533428165 - nodes in this community are weakly interconnected._
- **Should `ProyectosService` be split into smaller, more focused modules?**
  _Cohesion score 0.10252100840336134 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._