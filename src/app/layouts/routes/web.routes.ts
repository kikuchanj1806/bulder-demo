import { Routes } from '@angular/router';

export const AppRoutes: Routes = [
   {
      path: '',
      loadChildren: () => import('../../layouts/layout.module').then(m => m.LayoutModule)
   }
];
