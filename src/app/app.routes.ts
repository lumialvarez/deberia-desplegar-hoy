import { Routes } from '@angular/router';

import { DeployDashboardComponent } from './features/deploy-dashboard/deploy-dashboard.component';
import { NotFoundComponent } from './core/not-found/not-found.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: DeployDashboardComponent,
    title: '¿Deberías Desplegar Hoy?',
  },
  {
    path: '**',
    component: NotFoundComponent,
    title: '404 - No encontrado',
  },
];
