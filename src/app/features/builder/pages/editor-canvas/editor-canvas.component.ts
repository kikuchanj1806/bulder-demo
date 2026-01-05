import {AfterViewInit, Component, DestroyRef, ElementRef, inject, Input, OnInit, ViewChild} from '@angular/core';
import {EditorMode, PageSchema} from '../../mocks/home.schema.mock';
import {EditorStateService, EditorToolMode} from '../../state/editor-state.service';
import {distinctUntilChanged, filter} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-editor-canvas',
  templateUrl: './editor-canvas.component.html',
  styleUrls: ['./editor-canvas.component.scss'],
  standalone: false,
})
export class EditorCanvasComponent implements OnInit, AfterViewInit {
  @Input() schema: PageSchema | null = null;
  @Input() mode: EditorMode = 'mobile';
  @Input() toolMode: EditorToolMode = 'preview';
  @ViewChild('stage', { static: true }) stageRef!: ElementRef<HTMLElement>;
  private destroyRef = inject(DestroyRef);

  constructor(private state: EditorStateService) {}

  ngOnInit() {
    console.log('schema EditorCanvasComponent', this.schema)
  }


  ngAfterViewInit() {
    this.state.selectedId$
      .pipe(
        distinctUntilChanged(),
        filter((id): id is string => !!id),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((id) => {
        if (this.toolMode !== 'select') return;
        // đợi DOM render xong 1 tick (tránh case click layers -> select -> DOM chưa update)
        queueMicrotask(() => this.scrollToNode(id));
      });
  }

  clearSelection() {
    this.state.select(null);
  }

  onCanvasBgClick(ev: MouseEvent) {
    if (this.toolMode !== 'select') return;
    this.state.select(null);
    this.state.hover(null);
  }

  get bodyRootId(): string | null {
    return this.schema?.zones?.body?.rootId ?? null;
  }

  get frameClass(): string {
    return this.mode === 'mobile'
      ? 'device-frame device-mobile shadow-sm'
      : 'device-frame device-desktop shadow-sm';
  }

  private scrollToNode(nodeId: string) {
    const stage = this.stageRef.nativeElement; // container có overflow-auto
    const el = stage.querySelector<HTMLElement>(`[data-node-id="${nodeId}"]`);
    if (!el) return;

    const stageRect = stage.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    const currentTop = stage.scrollTop;
    const targetTop = currentTop + (elRect.top - stageRect.top) - 80;

    stage.scrollTo({
      top: Math.max(0, targetTop),
      behavior: 'smooth',
    });
  }
  onCanvasMouseMove(ev: MouseEvent) {
    if (this.toolMode !== 'select') return;

    const el = (ev.target as HTMLElement)?.closest?.('[data-node-id]') as HTMLElement | null;
    const id = el?.getAttribute('data-node-id') ?? null;

    this.state.hover(id);
  }

  onCanvasMouseLeave() {
    this.state.hover(null);
  }
}
