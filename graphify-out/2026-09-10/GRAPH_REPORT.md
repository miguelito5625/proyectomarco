# Graph Report - proyectomarco  (2026-08-26)

## Corpus Check
- 58 files · ~16,931 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 352 nodes · 534 edges · 21 communities (13 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2534735d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- main-layout.component.ts
- Proyecto
- dependencies
- proyectomarco
- registros-tiempov2-list.component.ts
- devDependencies
- app.routes.ts
- gastos-form.component.ts
- NominasService
- TrabajadoresService
- HorasTrabajadorComponent
- AGENTS.md
- RegistrosTiempov2ListComponent
- CostoLaborComponent
- update_responsive.js
- fix_ts.js
- CostoLaborDesgloseComponent
- query.js
- rules/graphify.md
- workflows/graphify.md

## God Nodes (most connected - your core abstractions)
1. `SupabaseService` - 24 edges
2. `HorasTrabajadorComponent` - 18 edges
3. `RegistrosTiempov2ListComponent` - 16 edges
4. `Proyecto` - 15 edges
5. `ProyectosService` - 15 edges
6. `CostoLaborComponent` - 14 edges
7. `TrabajadoresService` - 14 edges
8. `Trabajador` - 13 edges
9. `RegistrosTiempoListComponent` - 11 edges
10. `RegistrosTiempoService` - 10 edges

## Surprising Connections (you probably didn't know these)
- `RegistrosTiempov2ListComponent` --references--> `Proyecto`  [EXTRACTED]
  src/app/features/registros-tiempov2/registros-tiempov2-list/registros-tiempov2-list.component.ts → src/app/core/services/proyectos.service.ts
- `CostoLaborComponent` --references--> `Proyecto`  [EXTRACTED]
  src/app/features/reportes/costo-labor/costo-labor.component.ts → src/app/core/services/proyectos.service.ts
- `HorasTrabajadorComponent` --references--> `Proyecto`  [EXTRACTED]
  src/app/features/reportes/horas-trabajador/horas-trabajador.component.ts → src/app/core/services/proyectos.service.ts
- `HorasTrabajadorComponent` --references--> `Trabajador`  [EXTRACTED]
  src/app/features/reportes/horas-trabajador/horas-trabajador.component.ts → src/app/core/services/trabajadores.service.ts
- `RegistrosTiempov2ListComponent` --references--> `Trabajador`  [EXTRACTED]
  src/app/features/registros-tiempov2/registros-tiempov2-list/registros-tiempov2-list.component.ts → src/app/core/services/trabajadores.service.ts

## Import Cycles
- None detected.

## Communities (21 total, 8 thin omitted)

### Community 0 - "main-layout.component.ts"
Cohesion: 0.07
Nodes (16): Inject, App, appConfig, routes, Component, AppTheme, ThemeService, Injectable (+8 more)

### Community 1 - "Proyecto"
Cohesion: 0.10
Nodes (13): Proyecto, ProyectosService, Injectable, CostoLabor, CostoLaborFilters, HorasTrabajador, HorasTrabajadorFilters, ReportesService (+5 more)

### Community 2 - "dependencies"
Cohesion: 0.07
Nodes (27): @angular/animations, @angular/cdk, @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/material, @angular/platform-browser (+19 more)

### Community 3 - "proyectomarco"
Cohesion: 0.05
Nodes (40): build, serve, test, builder, configurations, defaultConfiguration, options, analytics (+32 more)

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

## Knowledge Gaps
- **66 isolated node(s):** `Reglas de Proyecto: proyectomarco`, `graphify`, `Workflow: graphify`, `analytics`, `packageManager` (+61 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HorasTrabajadorComponent` connect `HorasTrabajadorComponent` to `Proyecto`, `app.routes.ts`, `TrabajadoresService`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `SupabaseService` connect `app.routes.ts` to `main-layout.component.ts`, `Proyecto`, `registros-tiempov2-list.component.ts`, `gastos-form.component.ts`, `NominasService`, `TrabajadoresService`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `RegistrosTiempov2ListComponent` connect `RegistrosTiempov2ListComponent` to `Proyecto`, `registros-tiempov2-list.component.ts`, `app.routes.ts`, `TrabajadoresService`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **What connects `Reglas de Proyecto: proyectomarco`, `graphify`, `Workflow: graphify` to the rest of the system?**
  _66 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `main-layout.component.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07112375533428165 - nodes in this community are weakly interconnected._
- **Should `Proyecto` be split into smaller, more focused modules?**
  _Cohesion score 0.10252100840336134 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._