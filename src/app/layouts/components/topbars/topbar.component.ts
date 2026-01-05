import {Component, DestroyRef, inject, Input} from '@angular/core';
import {EditorStateService, EditorToolMode} from '../../../features/builder/state/editor-state.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

export type EditorStatus = 'Draft' | 'Published';
export type TopbarViewMode = 'select' | 'desktop' | 'fullscreen' | 'mobile';

@Component({
  selector: 'app-editor-topbar',
  templateUrl: `topbar.component.html`,
  styleUrls: [`topbar.component.scss`],
  standalone: false
})
export class EditorTopbarComponent {
  @Input() title = 'Template demo';
  @Input() status: EditorStatus = 'Draft';

  @Input() pageName = 'Home page';

  viewMode: TopbarViewMode = 'mobile';
  toolMode: EditorToolMode = 'preview';

  private destroyRef = inject(DestroyRef);

  constructor(private editorState: EditorStateService) {
    this.editorState.mode$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((m) => (this.viewMode = m));

    this.editorState.toolMode$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(m => (this.toolMode = m));
  }

  onSelectViewMode(vm: TopbarViewMode) {
    this.viewMode = vm;

    // map sang editor mode
    if (vm === 'desktop') this.editorState.setMode('desktop');
    if (vm === 'mobile') this.editorState.setMode('mobile');

    // if (vm === 'fullscreen') {
    //   // phương án đơn giản: fullscreen vẫn theo desktop
    //   this.editorState.setMode('desktop');
    //   this.editorState.setFullscreen(true); // nếu bạn có
    // } else {
    //   this.editorState.setFullscreen(false); // nếu bạn có
    // }
  }


  toggleSelect() {
    this.editorState.toggleToolMode();
  }


  get isSelectMode(): boolean {
    return this.toolMode === 'select';
  }

  onBack() {}
}
