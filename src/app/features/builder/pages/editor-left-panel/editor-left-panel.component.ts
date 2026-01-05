import {Component, inject} from '@angular/core';
import {EditorStateService} from '../../state/editor-state.service';
import {PALETTE_GROUPS} from '../../mocks/palette.data';
import {map} from 'rxjs';
import {CdkDragMove} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-editor-left-panel',
  templateUrl: './editor-left-panel.component.html',
  styleUrls: ['./editor-left-panel.component.scss'],
  standalone: false,
})
export class EditorLeftPanelComponent {
  private state = inject(EditorStateService);

  private readonly DL_PREFIX = 'dl-';

  collapsed = new Set<string>();
  selectedId$ = this.state.selectedId$;
  toolMode$ = this.state.toolMode$;
  schema$ = this.state.schema$;

  // ✅ palette cần biết danh sách droplist bên canvas để drag -> drop được
  canvasDropListIds$ = this.schema$.pipe(
    map((s) => {
      if (!s?.nodes) return [];
      const ids: string[] = [];
      for (const [id, n] of Object.entries(s.nodes)) {
        const isContainer = n.type === 'BLOCK' || n.type === 'GRID' || n.type === 'LIST';
        if (!isContainer) continue;
        ids.push(`${this.DL_PREFIX}${id}`); // khớp với dropListId ở CanvasNode
      }
      return ids;
    })
  );

  layersVm$ = this.schema$.pipe(
    map((s) => {
      if (!s) return null;

      const roots = this.state.getZoneRoots(s);
      return [
        { key: 'header', title: 'Header', rootId: roots.header },
        { key: 'body', title: 'Body', rootId: roots.body },
        { key: 'footer', title: 'Footer', rootId: roots.footer },
      ];
    })
  );

  groups = PALETTE_GROUPS;
  activeTab: 'components' | 'layers' = 'components';

  setTab(tab: 'components' | 'layers') {
    this.activeTab = tab;
  }

  isCollapsed(id: string) {
    return this.collapsed.has(id);
  }

  toggleCollapse(id: string) {
    if (this.collapsed.has(id)) this.collapsed.delete(id);
    else this.collapsed.add(id);
  }

  selectNode(id: string) {
    this.state.select(id);
    this.state.hover(id); // optional: để canvas hiện badge/outline ngay
  }

  onPaletteDragStarted() {
    console.log('[PALETTE][START]');
    this.state.beginPaletteDrag();
    this.state.setPaletteOverParentId(null);
  }

  onPaletteDragEnded() {
    console.log('[PALETTE][END] (do not clear here)');
  }

  onPaletteDragMoved(ev: CdkDragMove<any>) {
    const { x, y } = ev.pointerPosition;
    const el = document.elementFromPoint(x, y) as HTMLElement | null;

    const host = el?.closest?.('[data-drop-parent-id]') as HTMLElement | null;
    const rawHitId = host?.getAttribute('data-drop-parent-id') ?? null;

    const resolved = this.state.resolveNearestContainerId(rawHitId);
    this.state.setPaletteOverParentId(resolved);

    const idx = this.computeInsertIndex(resolved, x, y);
    this.state.setPaletteOverIndex(idx);

    console.log('[PALETTE][MOVE]', { rawHitId, resolved, idx });
  }

  private computeInsertIndex(containerId: string | null, x: number, y: number): number | null {
    if (!containerId) return null;

    const s = this.state.schemaSnapshot;
    const mode = this.state.modeSnapshot;
    if (!s) return null;

    const node = s.nodes?.[containerId];
    if (!node) return null;

    // ✅ suy ra orientation ngay tại left panel
    let ori: 'vertical' | 'horizontal' | 'mixed' = 'vertical';
    if (node.type === 'GRID') ori = 'mixed';
    else if (node.type === 'LIST') ori = 'vertical';
    else if (node.type === 'BLOCK') {
      const p = this.state.resolveProps(containerId, mode) as any;
      ori = p?.direction === 'ROW' ? 'horizontal' : 'vertical';
    }

    const dlEl = document.getElementById(`dl-${containerId}`);
    if (!dlEl) return null;

    const items = Array.from(dlEl.querySelectorAll(':scope > .ui-node-wrap')) as HTMLElement[];
    if (items.length === 0) return 0;

    const isH = ori === 'horizontal';
    const p = isH ? x : y;

    for (let i = 0; i < items.length; i++) {
      const r = items[i].getBoundingClientRect();
      const mid = isH ? (r.left + r.right) / 2 : (r.top + r.bottom) / 2;
      if (p < mid) return i;
    }
    return items.length;
  }
}
