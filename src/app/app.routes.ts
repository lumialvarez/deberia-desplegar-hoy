import { Routes } from '@angular/router';

import { NotFoundComponent } from './core/not-found/not-found.component';
import { DeployDashboardComponent } from './features/deploy-dashboard/deploy-dashboard.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: DeployDashboardComponent,
    title: '¿Deberías Desplegar Hoy?',
  },
  {
    path: '404',
    component: NotFoundComponent,
    title: '404 - No encontrado',
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];
