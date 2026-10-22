import { Routes } from '@angular/router';

import { authGuard, publicoGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión · Servicio Médico',
    canActivate: [publicoGuard],
    loadComponent: () => import('./views/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout').then((m) => m.DefaultLayoutComponent),
    children: [
      {
        path: '',
        title: 'Inicio · Servicio Médico',
        loadComponent: () =>
          import('./views/inicio/inicio.component').then((m) => m.InicioComponent),
      },
      {
        path: 'consultas',
        title: 'Consultas médicas · Servicio Médico',
        loadComponent: () =>
          import('./views/consultas/listado/consultas-listado.component').then(
            (m) => m.ConsultasListadoComponent,
          ),
      },
      {
        path: 'consultas/nueva',
        title: 'Nueva consulta · Servicio Médico',
        loadComponent: () =>
          import('./views/consultas/formulario/consulta-formulario.component').then(
            (m) => m.ConsultaFormularioComponent,
          ),
      },
      {
        path: 'consultas/:id',
        title: 'Consulta · Servicio Médico',
        loadComponent: () =>
          import('./views/consultas/formulario/consulta-formulario.component').then(
            (m) => m.ConsultaFormularioComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    title: 'No encontrado · Servicio Médico',
    loadComponent: () =>
      import('./views/no-encontrado/no-encontrado.component').then(
        (m) => m.NoEncontradoComponent,
      ),
  },
];
