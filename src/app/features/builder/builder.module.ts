import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LayoutModule} from '../../layouts/layout.module';
import {BuilderRouting} from './builder.routing';
import {EditorPageComponent} from './pages/editer-page/editor-page.component';
import {EditorCanvasComponent} from './pages/editor-canvas/editor-canvas.component';
import {EditorRightPanelComponent} from './pages/editor-right-panel/editor-right-panel.component';
import {EditorLeftPanelComponent} from './pages/editor-left-panel/editor-left-panel.component';
import {CanvasNodeComponent} from './pages/editor-canvas/components/canvas-node/canvas-node.component';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {EditorLayerNodeComponent} from './pages/editor-left-panel/components/editor-layer-node.component';
import {NodeTypeIconPipe} from '../../shared/pipes/node-type-icon.pipe';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {
  RpPanelContainerComponent
} from './pages/editor-right-panel/components/rp-panel-container/rp-panel-container.component';
import {RpPanelGridComponent} from './pages/editor-right-panel/components/rp-panel-grid/rp-panel-grid.component';
import {RpPanelTextComponent} from './pages/editor-right-panel/components/rp-panel-text/rp-panel-text.component';
import {RpPanelImageComponent} from './pages/editor-right-panel/components/rp-panel-image/rp-panel-image.component';
import {RpPanelCardComponent} from './pages/editor-right-panel/components/rp-panel-card/rp-panel-card.component';


@NgModule({
  declarations: [
    EditorPageComponent,
    EditorCanvasComponent,
    EditorRightPanelComponent,
    EditorLeftPanelComponent,
    CanvasNodeComponent,
    EditorLayerNodeComponent,
    RpPanelContainerComponent,
    RpPanelGridComponent,
    RpPanelTextComponent,
    RpPanelImageComponent,
    RpPanelCardComponent,
  ],
  imports: [CommonModule, BuilderRouting, LayoutModule, DragDropModule, NodeTypeIconPipe, ReactiveFormsModule],
})
export class BuilderModule {
}
