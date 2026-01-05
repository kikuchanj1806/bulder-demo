import {Component, inject, OnInit} from '@angular/core';
import {EditorStateService} from '../../state/editor-state.service';
import {EditorMode, HOME_PAGE_SCHEMA_MOCK} from '../../mocks/home.schema.mock';

@Component({
  selector: 'app-editor-page',
  templateUrl: 'editor-page.component.html',
  styleUrls: ['editor-page.component.scss'],
  standalone: false
})
export class EditorPageComponent implements OnInit {
  private stateService = inject(EditorStateService);

  schema$ = this.stateService.schema$;
  mode$ = this.stateService.mode$;
  toolMode$ = this.stateService.toolMode$;

  ngOnInit() {
    this.stateService.setSchema(HOME_PAGE_SCHEMA_MOCK);
    this.stateService.setMode('mobile'); // default
  }

  setMode(mode: EditorMode) {
    this.stateService.setMode(mode);
  }
}
