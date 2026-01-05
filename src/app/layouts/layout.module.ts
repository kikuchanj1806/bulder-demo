import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AngularSplitModule} from 'angular-split';
import {LayoutComponent} from './components/layouts/layout.component';
import {EditorTopbarComponent} from './components/topbars/topbar.component';
import {RouterModule, Routes} from '@angular/router';
import {BuilderModule} from '../features/builder/builder.module';
import {EditorPageComponent} from '../features/builder/pages/editer-page/editor-page.component';
import {NgbTooltip} from '@ng-bootstrap/ng-bootstrap';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('../features/builder/builder.module').then((m) => m.BuilderModule)
  }
];

@NgModule({
  declarations: [
    LayoutComponent,
    EditorTopbarComponent
  ],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    AngularSplitModule,
    NgbTooltip,
  ],
  exports: [LayoutComponent],
})
export class LayoutModule {
}
