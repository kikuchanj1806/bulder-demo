import {Component, EventEmitter, Input, Output} from '@angular/core';
import {EditorMode, PageSchema, SchemaNode} from '../../../mocks/home.schema.mock';
import {EditorStateService, EditorToolMode} from '../../../state/editor-state.service';
import {CdkDragDrop} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-editor-layer-node',
  templateUrl: './editor-layer-node.component.html',
  styleUrls: ['./editor-layer-node.component.scss'],
  standalone: false,
})
export class EditorLayerNodeComponent {
  @Input({required: true}) schema!: PageSchema;
  @Input({required: true}) nodeId!: string;
  @Input({required: true}) depth!: number;

  @Input() selectedId: string | null = null;
  @Input() parentId: string | null = null;
  @Input() toolMode: EditorToolMode = 'preview';
  @Input() collapsed!: Set<string>;
  @Input() mode: EditorMode = 'mobile';

  @Output() toggle = new EventEmitter<string>();
  @Output() pick = new EventEmitter<string>();

  constructor(private state: EditorStateService) {
  }

  get node(): SchemaNode {
    return this.schema.nodes[this.nodeId];
  }

  get isContainer(): boolean {
    return this.node.type === 'BLOCK' || this.node.type === 'GRID' || this.node.type === 'LIST';
  }

  get isCollapsed(): boolean {
    return this.collapsed.has(this.nodeId);
  }

  get children(): string[] {
    return this.node.children ?? [];
  }

  get canDnd(): boolean {
    return this.toolMode === 'select' && !!this.parentId;
  }

  onToggle(ev: MouseEvent) {
    ev.stopPropagation();
    this.toggle.emit(this.nodeId);
  }

  onPick(ev?: MouseEvent) {
    ev?.stopPropagation();
    this.pick.emit(this.nodeId);
  }

  onChildrenDrop(ev: CdkDragDrop<string[]>) {
    if (!this.canDnd) return;

    // ✅ chỉ reorder trong cùng container
    if (ev.previousContainer !== ev.container) return;
    if (ev.previousIndex === ev.currentIndex) return;

    this.state.reorderChildren(this.nodeId, ev.previousIndex, ev.currentIndex);
  }

  get canDelete(): boolean {
    if (this.toolMode !== 'select') return false;
    // chặn root (tuỳ bạn)
    const rootIds = new Set([
      this.schema.zones.header.rootId,
      this.schema.zones.body.rootId,
      this.schema.zones.footer.rootId,
    ]);
    return !rootIds.has(this.nodeId);
  }

  onToggleVisible(ev: MouseEvent) {
    ev.stopPropagation();
    if (!this.canDnd) return; // hoặc dùng canEdit/canSelect tuỳ bạn
    this.state.toggleNodeVisible(this.nodeId, this.mode, 'mode'); // hoặc 'base'
  }

  get isVisible(): boolean {
    return this.state.isNodeVisible(this.nodeId, this.mode);
  }

  onDelete(ev: MouseEvent) {
    ev.stopPropagation();
    if (!this.canDelete) return;

    this.state.removeNodeById(this.nodeId);
  }

  trackById(_: number, id: string) {
    return id;
  }
}
