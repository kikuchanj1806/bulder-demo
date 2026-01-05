import {Component, Input, OnInit, DestroyRef, inject, OnDestroy, ChangeDetectorRef, AfterViewInit} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {
  Background,
  EdgeInsets,
  EditorMode,
  NodePropsBase,
  PageSchema,
  SchemaNode
} from '../../../../mocks/home.schema.mock';
import {EditorStateService, EditorToolMode} from '../../../../state/editor-state.service';
import {CdkDragDrop, CdkDragEnter} from '@angular/cdk/drag-drop';
import {auditTime} from 'rxjs';

@Component({
  selector: 'app-canvas-node',
  templateUrl: './canvas-node.component.html',
  styleUrls: ['canvas-node.component.scss'],
  standalone: false,
})
export class CanvasNodeComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input({required: true}) schema!: PageSchema;
  @Input({required: true}) nodeId!: string;
  @Input({required: true}) mode!: EditorMode;
  @Input() toolMode: EditorToolMode = 'preview';

  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  selectedId: string | null = null;
  hoverId: string | null = null;

  private readonly DL_PREFIX = 'dl-';
  connectedTo: string[] = ['palette'];

  constructor(public state: EditorStateService) {
    this.state.selectedId$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => (this.selectedId = id));

    this.state.hoverId$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => (this.hoverId = id));
  }

  ngOnInit() {
    console.log()
  }

  ngAfterViewInit() {
    if (this.isContainer && this.isVisible) {
      queueMicrotask(() => this.state.registerDropList(this.dropListId));
    }

    this.state.dropListIds$
      .pipe(
        auditTime(0),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((ids) => {
        if (this.toolMode !== 'select' || !this.isContainer) {
          this.connectedTo = ['palette'];
          this.cdr.markForCheck();
          return;
        }

        const reg = new Set(ids);
        const next: string[] = [];

        for (const [id, n] of Object.entries(this.schema.nodes)) {
          const isC = n.type === 'BLOCK' || n.type === 'GRID' || n.type === 'LIST';
          if (!isC) continue;
          if (id === this.nodeId) continue;

          const dlId = `${this.DL_PREFIX}${id}`;
          if (!reg.has(dlId)) continue;
          next.push(dlId);
        }

        // luôn cho phép palette drop vào container
        next.push('palette');

        this.connectedTo = next;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    if (this.isContainer) {
      queueMicrotask(() => this.state.unregisterDropList(this.dropListId));
    }
  }

  get node(): SchemaNode {
    return this.schema.nodes[this.nodeId];
  }

  get isSelected(): boolean {
    return this.selectedId === this.nodeId;
  }

  get isHover(): boolean {
    return this.hoverId === this.nodeId;
  }

  get dropListId(): string {
    return `${this.DL_PREFIX}${this.nodeId}`;
  }

  get isPaletteOver(): boolean {
    return this.toolMode === 'select'
      && this.state.paletteDragActiveSnapshot
      && this.state.paletteOverParentIdSnapshot === this.nodeId;
  }

  private parentIdFromDropListId(id: string): string {
    return id.startsWith(this.DL_PREFIX) ? id.slice(this.DL_PREFIX.length) : id;
  }

  onSelect(ev: MouseEvent) {
    if (this.toolMode !== 'select') return;
    ev.stopPropagation();
    this.state.select(this.nodeId);
    this.state.hover(this.nodeId);
  }

  onEnter() {
    if (this.toolMode !== 'select') return;
    this.state.hover(this.nodeId);
  }

  onLeave() {
    if (this.toolMode !== 'select') return;
    if (this.hoverId === this.nodeId) this.state.hover(null);
  }

  onDropListEntered(ev: CdkDragEnter<string[]>) {
    if (this.toolMode !== 'select') return;

    const data = ev.item.data as any;

    console.log('[ENTER]', {
      enteredNodeId: this.nodeId,
      enteredDropListId: ev.container.id,
      dragData: data,
      pointerOver: (ev as any)?.container?.element?.nativeElement?.getAttribute?.('data-node-id'),
    });

    // chỉ quan tâm palette
    if (data?.kind === 'palette') {
      console.log('[ENTER][PALETTE] setPaletteOverParentId =', this.nodeId);
      this.state.setPaletteOverParentId(this.nodeId);
    }
  }

  onDrop(ev: CdkDragDrop<string[]>) {
    if (this.toolMode !== 'select') return;

    const rawDstParentId = this.parentIdFromDropListId(ev.container.id);  // nodeId
    const data = ev.item.data as any;
    const persistedOver = this.state.paletteOverParentIdSnapshot;

    console.log('[DROP]', {
      componentNodeId: this.nodeId,
      prev: ev.previousContainer.id,
      dst: ev.container.id,
      rawDstParentId,
      persistedOver,
      sameContainer: ev.previousContainer === ev.container,
      prevIndex: ev.previousIndex,
      curIndex: ev.currentIndex,
      data,
    });

    if (data?.kind === 'palette') {
      const overRaw = this.state.paletteOverParentIdSnapshot;
      const overContainer = this.state.resolveNearestContainerId(overRaw); // ✅ luôn ra container nodeId

      const realDstParentId = overContainer ?? rawDstParentId;

      const pointerIndex = this.state.paletteOverIndexSnapshot;
      let toIndex = pointerIndex ?? ev.currentIndex;

      // nếu drop event xảy ra ở container khác (body root) mà real dst là container con
      // thì ev.currentIndex không đáng tin => fallback append nếu chưa có pointerIndex
      if (realDstParentId !== rawDstParentId && pointerIndex == null) {
        toIndex = this.state.getChildrenLen(realDstParentId);
      }

      console.log('[DROP][PALETTE][FINAL]', { rawDstParentId, overRaw, overContainer, realDstParentId, toIndex });

      this.state.insertFromPalette(realDstParentId, toIndex, data.type);

      // ✅ palette item không được “di chuyển” khỏi palette
      ev.item.reset();

      this.state.endPaletteDrag(); // clear over + index luôn ở đây
      return;
    }

    if (data?.kind === 'node') {
      const dstParentId = rawDstParentId;
      const srcParentId = data.fromParentId as string;
      const movedNodeId = data.nodeId as string;

      console.log('[DROP][NODE]', {srcParentId, dstParentId, movedNodeId});

      if (srcParentId === dstParentId) {
        console.log('[DROP][NODE] reorderChildren', {dstParentId, from: ev.previousIndex, to: ev.currentIndex});
        this.state.reorderChildren(dstParentId, ev.previousIndex, ev.currentIndex);
        return;
      }

      console.log('[DROP][NODE] moveNodeById', {movedNodeId, srcParentId, dstParentId, to: ev.currentIndex});
      this.state.moveNodeById(movedNodeId, srcParentId, dstParentId, ev.currentIndex);
      return;
    }

    console.warn('[DROP] unknown drag data', data);
  }

  get props(): NodePropsBase {
    const base = this.node.props?.base ?? ({} as NodePropsBase);
    const ov = this.node.props?.overrides?.[this.mode] ?? {};
    return {...base, ...ov};
  }

  get isVisible(): boolean {
    return this.props.isVisible !== false;
  }


  isNodeVisible(id: string): boolean {
    const n = this.schema?.nodes?.[id];
    if (!n) return true;

    const base = n.props?.base ?? {};
    const ov = n.props?.overrides?.[this.mode] ?? {};
    const merged = {...base, ...ov};

    return merged.isVisible !== false;
  }

  isActiveNode(id: string): boolean {
    if (this.toolMode !== 'select') return false;
    return this.selectedId === id || this.hoverId === id;
  }

  get showHandle(): boolean {
    return this.isActiveNode(this.nodeId); // chỉ cho chính node hiện tại
  }

  childIds(): string[] {
    return this.node.children ?? [];
  }

  get isContainer(): boolean {
    return this.node.type === 'BLOCK' || this.node.type === 'GRID' || this.node.type === 'LIST';
  }

  private buildParentMap(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const [pid, n] of Object.entries(this.schema.nodes)) {
      for (const cid of (n.children ?? [])) map[cid] = pid;
    }
    return map;
  }

  private ancestorsOf(nodeId: string): Set<string> {
    const parentMap = this.buildParentMap();
    const res = new Set<string>();
    let cur = parentMap[nodeId];
    while (cur) {
      res.add(cur);
      cur = parentMap[cur];
    }
    return res;
  }

  canEnter = (drag: any, drop: any) => {
    if (this.toolMode !== 'select') return false;

    const data = drag?.data as any;
    const dstParentId = this.parentIdFromDropListId(drop?.id ?? '');

    // ===== CASE: PALETTE =====
    if (data?.kind === 'palette') {
      // container mà bạn tính được bằng elementFromPoint (resolveNearestContainerId)
      const over = this.state.paletteOverParentIdSnapshot;

      // Nếu chưa resolve được thì cho phép container hiện tại (tránh dead)
      if (!over) return true;

      // ✅ CHỈ cho phép enter đúng container đang over
      const ok = over === dstParentId;

      // debug khi cần
      console.log('[PRED][PALETTE]', { dropId: drop.id, dstParentId, over, ok });

      return ok;
    }

    // ===== CASE: MOVE NODE (giữ logic cũ của bạn) =====
    if (data?.kind === 'node') {
      const fromParentId = data.fromParentId as string | undefined;
      if (!fromParentId) return true;

      // chặn drop vào ancestor của source parent
      const ancestorsOfSrc = this.ancestorsOf(fromParentId);
      if (ancestorsOfSrc.has(dstParentId)) return false;

      return true;
    }

    return false;
  };

  trackById(_: number, id: string) {
    return id;
  }

  private insetToCss(v?: EdgeInsets): string | null {
    if (!v) return null;
    return `${v.top}px ${v.right}px ${v.bottom}px ${v.left}px`;
  }

  private applyBackground(style: Record<string, any>, bg?: Background) {
    if (!bg) return;
    if (bg.type === 'COLOR') style['background'] = bg.value;
    if (bg.type === 'IMAGE') {
      style['backgroundImage'] = `url(${bg.value})`;
      style['backgroundSize'] = 'cover';
      style['backgroundPosition'] = 'center';
      style['backgroundRepeat'] = 'no-repeat';
    }
  }

  get dropOrientation(): 'vertical' | 'horizontal' | 'mixed' {
    if (this.node.type === 'GRID') return 'mixed';
    if (this.node.type === 'LIST') return 'vertical';
    if (this.node.type === 'BLOCK') {
      return this.props.direction === 'ROW' ? 'horizontal' : 'vertical';
    }
    return 'vertical';
  }

  blockStyle(): Record<string, any> {
    const p = this.props;
    const style: Record<string, any> = {
      display: 'flex',
      flexDirection: p.direction === 'ROW' ? 'row' : 'column',
      gap: p.gap != null ? `${p.gap}px` : null,
      padding: this.insetToCss(p.padding),
      margin: this.insetToCss(p.margin),
      borderRadius: p.radius != null ? `${p.radius}px` : null,
    };

    const mapA: any = {START: 'flex-start', CENTER: 'center', END: 'flex-end', STRETCH: 'stretch'};
    const mapJ: any = {START: 'flex-start', CENTER: 'center', END: 'flex-end', SPACE_BETWEEN: 'space-between'};
    if (p.align) style['alignItems'] = mapA[p.align] ?? null;
    if (p.justify) style['justifyContent'] = mapJ[p.justify] ?? null;

    this.applyBackground(style, p.background);
    Object.keys(style).forEach((k) => (style[k] == null ? delete style[k] : 0));
    return style;
  }

  textStyle(): Record<string, any> {
    const p = this.props;
    const style: Record<string, any> = {
      color: this.schema.designTokens?.textColor ?? '#212529',
      fontSize: p.fontSize != null ? `${p.fontSize}px` : null,
      fontWeight: p.fontWeight ?? null,
      whiteSpace: 'pre-line',
    };
    Object.keys(style).forEach((k) => (style[k] == null ? delete style[k] : 0));
    return style;
  }

  imgStyle(): Record<string, any> {
    const p = this.props;
    const style: Record<string, any> = {
      width: '100%',
      display: 'block',
      borderRadius: p.radius != null ? `${p.radius}px` : null,
      objectFit: 'cover',
    };
    Object.keys(style).forEach((k) => (style[k] == null ? delete style[k] : 0));
    return style;
  }

  gridStyle(): Record<string, any> {
    const p = this.props;
    const cols = p.columns ?? 2;
    const gap = p.gap ?? 12;
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gap: `${gap}px`,
    };
  }

  listStyle(): Record<string, any> {
    const p = this.props;
    const gap = p.gap ?? 12;
    return {display: 'flex', flexDirection: 'column', gap: `${gap}px`};
  }
}
