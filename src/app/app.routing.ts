import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AppRoutes} from './layouts/routes/web.routes';

@NgModule({
  imports: [
    // RouterModule.forRoot(routes),
    RouterModule.forRoot(AppRoutes, {
      // scrollPositionRestoration: 'top',
      // anchorScrolling: 'enabled',
      initialNavigation: 'enabledBlocking',
      scrollPositionRestoration: 'enabled',
      // useHash: true,
      // onSameUrlNavigation: 'reload'
    })
  ],
  exports: [RouterModule]
})
export class AppRouting {
}
