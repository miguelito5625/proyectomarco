import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { HomeComponent } from './features/home/home.component';
import { TrabajadoresListComponent } from './features/trabajadores/trabajadores-list/trabajadores-list.component';
import { ProyectosListComponent } from './features/proyectos/proyectos-list/proyectos-list.component';
import { RegistrosTiempoListComponent } from './features/registros-tiempo/registros-tiempo-list/registros-tiempo-list.component';
import { NominasListComponent } from './features/nominas/nominas-list/nominas-list.component';
import { GastosListComponent } from './features/gastos/gastos-list/gastos-list.component';
import { CostoLaborComponent } from './features/reportes/costo-labor/costo-labor.component';
import { HorasTrabajadorComponent } from './features/reportes/horas-trabajador/horas-trabajador.component';
import { authGuard } from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [noAuthGuard]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        component: HomeComponent
      },
      {
        path: 'trabajadores',
        component: TrabajadoresListComponent
      },
      {
        path: 'proyectos',
        component: ProyectosListComponent
      },
      {
        path: 'registros-tiempo',
        component: RegistrosTiempoListComponent
      },
      {
        path: 'nominas',
        component: NominasListComponent
      },
      {
        path: 'gastos',
        component: GastosListComponent
      },
      {
        path: 'reporte-costo-labor',
        component: CostoLaborComponent
      },
      {
        path: 'reporte-horas-trabajador',
        component: HorasTrabajadorComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
