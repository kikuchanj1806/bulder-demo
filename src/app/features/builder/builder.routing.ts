import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {EditorPageComponent} from './pages/editer-page/editor-page.component';

const routes: Routes = [
  { path: 'editor', component: EditorPageComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BuilderRouting {}
