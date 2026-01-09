import {Injectable} from '@angular/core';
import {BehaviorSubject, distinctUntilChanged, map} from 'rxjs';
import {EditorMode, PageSchema, SchemaNode, NodePropsBase, NodeType} from '../mocks/home.schema.mock';
import {moveItemInArray} from '@angular/cdk/drag-drop';

export type EditorToolMode = 'select' | 'preview';

type PersistedEditorState = {
  v: 1; // version để sau này đổi schema vẫn migrate được
  deviceMode: 'mobile' | 'desktop';
  toolMode: EditorToolMode;
};

export type DropListId = string;

export type LayerItem = {
  id: string;
  type: string;
  children: string[];
  isContainer: boolean;
};

type PropsScope = 'base' | 'override';

@Injectable({providedIn: 'root'})
export class EditorStateService {
  private readonly LS_KEY = 'builder.editorState';
  private persisted = this.readPersisted();

  private _schema$ = new BehaviorSubject<PageSchema | null>(null);
  readonly schema$ = this._schema$.asObservable();

  private _mode$ = new BehaviorSubject<EditorMode>(this.persisted.deviceMode);
  readonly mode$ = this._mode$.asObservable();

  private _toolMode$ = new BehaviorSubject<EditorToolMode>(this.persisted.toolMode);
  readonly toolMode$ = this._toolMode$.asObservable();

  private _selectedId$ = new BehaviorSubject<string | null>(null);
  readonly selectedId$ = this._selectedId$.asObservable();

  private _hoverId$ = new BehaviorSubject<string | null>(null);
  readonly hoverId$ = this._hoverId$.asObservable();

  // ===== palette drag state =====
  private _paletteDragActive$ = new BehaviorSubject<boolean>(false);
  readonly paletteDragActive$ = this._paletteDragActive$.asObservable();

  private _paletteOverParentId$ = new BehaviorSubject<string | null>(null);
  readonly paletteOverParentId$ = this._paletteOverParentId$.asObservable();

  private _paletteOverIndex$ = new BehaviorSubject<number | null>(null);
  readonly paletteOverIndex$ = this._paletteOverIndex$.asObservable();
  get paletteOverIndexSnapshot(): number | null { return this._paletteOverIndex$.value; }

  private _dropListIds$ = new BehaviorSubject<Set<DropListId>>(new Set());
  readonly dropListIds$ = this._dropListIds$.asObservable().pipe(
    map(set => Array.from(set))
  );

  constructor() {
    this._mode$.pipe(distinctUntilChanged()).subscribe(v => this.writePersisted({deviceMode: v}));
    this._toolMode$.pipe(distinctUntilChanged()).subscribe(v => this.writePersisted({toolMode: v}));
  }

  setSchema(schema: PageSchema) {
    this._schema$.next(schema);
  }

  setMode(mode: EditorMode) {
    this._mode$.next(mode);
  }

  setToolMode(m: EditorToolMode) {
    this._toolMode$.next(m);
    if (m !== 'select') {
      this._selectedId$.next(null);
      this._hoverId$.next(null);
    }
  }

  get getToolMode(): EditorToolMode {
    return this._toolMode$.value;
  }

  select(nodeId: string | null) {
    this._selectedId$.next(nodeId);
  }

  hover(nodeId: string | null) {
    this._hoverId$.next(nodeId);
  }

  toggleToolMode() {
    const cur = this._toolMode$.value;
    const next: EditorToolMode = cur === 'select' ? 'preview' : 'select';
    this._toolMode$.next(next);

    if (next !== 'select') {
      this._hoverId$.next(null);
      this._selectedId$.next(null);
    }
  }

  reorderChildren(parentId: string, from: number, to: number) {
    const s = this._schema$.value;
    if (!s) return;

    const parent = s.nodes?.[parentId];
    if (!parent) return;

    const nextChildren = [...(parent.children ?? [])];
    if (from < 0 || to < 0 || from >= nextChildren.length || to >= nextChildren.length) return;

    moveItemInArray(nextChildren, from, to);

    const nextSchema: PageSchema = {
      ...s,
      nodes: {
        ...s.nodes,
        [parentId]: {
          ...parent,
          children: nextChildren,
        },
      },
    };

    this._schema$.next(nextSchema);

    // để debug/chuẩn bị phase save
    // console.log('[reorder]', parentId, from, '->', to, nextChildren);
  }

  moveChild(srcParentId: string, dstParentId: string, fromIndex: number, toIndex: number) {
    const s = this._schema$.value;
    if (!s) return;

    const src = s.nodes[srcParentId];
    const dst = s.nodes[dstParentId];
    if (!src || !dst) return;

    const srcChildren = [...(src.children ?? [])];
    const dstChildren = [...(dst.children ?? [])];

    if (fromIndex < 0 || fromIndex >= srcChildren.length) return;

    const [movedId] = srcChildren.splice(fromIndex, 1);
    if (!movedId) return;

    // clamp toIndex
    const safeTo = Math.max(0, Math.min(toIndex, dstChildren.length));
    dstChildren.splice(safeTo, 0, movedId);

    const next: PageSchema = {
      ...s,
      nodes: {
        ...s.nodes,
        [srcParentId]: {...src, children: srcChildren},
        [dstParentId]: {...dst, children: dstChildren},
      },
    };

    this._schema$.next(next);
  }

  // helpers sync
  get schemaSnapshot(): PageSchema | null {
    return this._schema$.value;
  }

  get modeSnapshot(): EditorMode {
    return this._mode$.value;
  }

  get selectedIdSnapshot(): string | null {
    return this._selectedId$.value;
  }

  isContainerNode(nodeId: string): boolean {
    const s = this._schema$.value;
    const n = s?.nodes?.[nodeId];
    if (!n) return false;
    return n.type === 'BLOCK' || n.type === 'GRID' || n.type === 'LIST';
  }

  private buildParentMap(s: PageSchema): Record<string, string> {
    const map: Record<string, string> = {};
    for (const [pid, n] of Object.entries(s.nodes ?? {})) {
      for (const cid of (n.children ?? [])) map[cid] = pid;
    }
    return map;
  }

// ✅ leaf/text/image -> climb lên container gần nhất
  resolveNearestContainerId(nodeId: string | null): string | null {
    if (!nodeId) return null;
    const s = this._schema$.value;
    if (!s?.nodes) return null;

    if (this.isContainerNode(nodeId)) return nodeId;

    const parentMap = this.buildParentMap(s);
    let cur = parentMap[nodeId];
    while (cur) {
      if (this.isContainerNode(cur)) return cur;
      cur = parentMap[cur];
    }
    return null;
  }

  get paletteOverParentIdSnapshot(): string | null {
    return this._paletteOverParentId$.value; // nếu bạn có subject này
  }

  getChildrenLen(parentId: string): number {
    const s = this._schema$.value;
    const n = s?.nodes?.[parentId];
    return (n?.children ?? []).length;
  }

  get paletteDragActiveSnapshot(): boolean {
    return this._paletteDragActive$.value;
  }

  beginPaletteDrag() {
    this._paletteDragActive$.next(true);
    this._paletteOverParentId$.next(null);
    this._paletteOverIndex$.next(null);
  }

  endPaletteDrag() {
    this._paletteDragActive$.next(false);
    this._paletteOverParentId$.next(null);
    this._paletteOverIndex$.next(null);
  }

  setPaletteOverParentId(id: string | null) {
    if (!this._paletteDragActive$.value) return;
    this._paletteOverParentId$.next(id);
  }

  setPaletteOverIndex(i: number | null) {
    if (!this._paletteDragActive$.value) return;
    this._paletteOverIndex$.next(i);
  }

  getNode(nodeId: string): SchemaNode | null {
    const s = this._schema$.value;
    return s?.nodes?.[nodeId] ?? null;
  }

  get dropListIdsSnapshot(): Set<DropListId> {
    return this._dropListIds$.value;
  }

  registerDropList(id: DropListId) {
    const next = new Set(this._dropListIds$.value);
    if (!next.has(id)) {
      next.add(id);
      this._dropListIds$.next(next);
      console.log('[DL][REGISTER]', id, 'size=', next.size);
    }
  }

  unregisterDropList(id: DropListId) {
    const next = new Set(this._dropListIds$.value);
    if (next.delete(id)) {
      this._dropListIds$.next(next);
      console.log('[DL][UNREGISTER]', id, 'size=', next.size);
    }
  }

  resolveProps(nodeId: string, mode: EditorMode): NodePropsBase | null {
    const n = this.getNode(nodeId);
    if (!n) return null;
    const base = n.props?.base ?? ({} as NodePropsBase);
    const ov = n.props?.overrides?.[mode] ?? {};
    return {...base, ...ov};
  }

  private readPersisted(): PersistedEditorState {
    try {
      const raw = localStorage.getItem(this.LS_KEY);
      if (!raw) return {v: 1, deviceMode: 'mobile', toolMode: 'preview'};

      const parsed = JSON.parse(raw) as Partial<PersistedEditorState>;
      return {
        v: 1,
        deviceMode: parsed.deviceMode === 'desktop' ? 'desktop' : 'mobile',
        toolMode: parsed.toolMode === 'select' ? 'select' : 'preview',
      };
    } catch {
      return {v: 1, deviceMode: 'mobile', toolMode: 'preview'};
    }
  }

  private writePersisted(patch: Partial<PersistedEditorState>) {
    const current = this.readPersisted();
    const next = {...current, ...patch, v: 1};
    localStorage.setItem(this.LS_KEY, JSON.stringify(next));
  }

  insertFromPalette(dstParentId: string, toIndex: number, type: NodeType) {
    const s = this._schema$.value;
    if (!s) return;

    const dst = s.nodes[dstParentId];
    if (!dst) return;

    const newId = this.genNodeId(type, s);

    const newNode: SchemaNode = {
      id: newId,
      type,
      children: [],
      props: {base: this.defaultPropsFor(type)},
    };

    const dstChildren = [...(dst.children ?? [])];
    const safeTo = Math.max(0, Math.min(toIndex, dstChildren.length));
    dstChildren.splice(safeTo, 0, newId);

    const next: PageSchema = {
      ...s,
      nodes: {
        ...s.nodes,
        [newId]: newNode,
        [dstParentId]: {...dst, children: dstChildren},
      },
    };

    this._schema$.next(next);

    // ✅ auto select
    this.select(newId);
    this.hover(newId);
  }

  private genNodeId(type: NodeType, s: PageSchema): string {
    const base = `n_${type.toLowerCase()}_${Date.now()}`;
    let id = base;
    let i = 1;
    while (s.nodes[id]) id = `${base}_${i++}`;
    return id;
  }

  private defaultPropsFor(type: NodeType): NodePropsBase {
    switch (type) {
      case 'TEXT':
        return {content: 'New text', fontSize: 14};
      case 'IMAGE':
        return {imageUrl: 'https://picsum.photos/600/400?random=99', radius: 12};
      case 'BLOCK':
        return {direction: 'COLUMN', gap: 12, padding: {top: 12, right: 12, bottom: 12, left: 12}};
      case 'GRID':
        return {columns: 2, gap: 12};
      case 'LIST':
        return {gap: 12};
      case 'PRODUCT_CARD':
        return {title: 'New product', price: '0đ', imageUrl: 'https://picsum.photos/400/300?random=98'};
      case 'BLOG_CARD':
        return {title: 'New post', imageUrl: 'https://picsum.photos/600/400?random=97'};
      default:
        return {};
    }
  }

  moveNodeById(nodeId: string, srcParentId: string, dstParentId: string, toIndex: number) {
    const s = this._schema$.value;
    if (!s) return;

    const src = s.nodes[srcParentId];
    const dst = s.nodes[dstParentId];
    if (!src || !dst) return;

    const srcChildren = [...(src.children ?? [])];
    const dstChildren = [...(dst.children ?? [])];

    const fromIndex = srcChildren.indexOf(nodeId);
    if (fromIndex < 0) return;

    srcChildren.splice(fromIndex, 1);

    const safeTo = Math.max(0, Math.min(toIndex, dstChildren.length));
    dstChildren.splice(safeTo, 0, nodeId);

    const next: PageSchema = {
      ...s,
      nodes: {
        ...s.nodes,
        [srcParentId]: {...src, children: srcChildren},
        [dstParentId]: {...dst, children: dstChildren},
      },
    };

    this._schema$.next(next);

    this.select(nodeId);
    this.hover(nodeId);
  }

  getZoneRoots(schema: PageSchema) {
    return {
      header: schema.zones.header.rootId,
      body: schema.zones.body.rootId,
      footer: schema.zones.footer.rootId,
    };
  }

  removeNodeById(nodeId: string) {
    const s = this._schema$.value;
    if (!s) return;

    // ✅ không cho xóa root của zones
    const rootIds = new Set<string>([
      s.zones?.header?.rootId,
      s.zones?.body?.rootId,
      s.zones?.footer?.rootId,
    ].filter(Boolean) as string[]);

    if (rootIds.has(nodeId)) return;

    // build parent map để biết nodeId đang nằm trong children của ai
    const parentMap: Record<string, string> = {};
    for (const [pid, n] of Object.entries(s.nodes ?? {})) {
      for (const cid of (n.children ?? [])) parentMap[cid] = pid;
    }

    const parentId = parentMap[nodeId];
    if (!parentId) {
      // node mồ côi (không có parent) => vẫn cho xóa subtree nếu muốn,
      // nhưng thường nên return để tránh schema sai
      return;
    }

    // ✅ collect subtree ids cần xóa (nodeId + toàn bộ descendants)
    const toDelete = new Set<string>();
    const stack: string[] = [nodeId];

    while (stack.length) {
      const cur = stack.pop()!;
      if (toDelete.has(cur)) continue;
      toDelete.add(cur);

      const n = s.nodes[cur];
      if (!n) continue;
      for (const cid of (n.children ?? [])) {
        stack.push(cid);
      }
    }

    // ✅ update parent children (remove nodeId)
    const parent = s.nodes[parentId];
    if (!parent) return;

    const nextParentChildren = (parent.children ?? []).filter((id) => id !== nodeId);

    // ✅ build next nodes map: clone + delete subtree
    const nextNodes: Record<string, SchemaNode> = {...(s.nodes ?? {})};

    // an toàn: gỡ mọi reference tới node bị xóa trong các children còn lại (optional nhưng nên có)
    for (const [id, n] of Object.entries(nextNodes)) {
      if (toDelete.has(id)) continue;
      if (!n.children?.length) continue;
      const cleaned = n.children.filter((cid) => !toDelete.has(cid));
      if (cleaned.length !== n.children.length) {
        nextNodes[id] = {...n, children: cleaned};
      }
    }

    // cập nhật parent
    nextNodes[parentId] = {...parent, children: nextParentChildren};

    // delete subtree nodes
    for (const id of toDelete) {
      delete nextNodes[id];
    }

    const nextSchema: PageSchema = {
      ...s,
      nodes: nextNodes,
    };

    this._schema$.next(nextSchema);

    // ✅ clear selected/hover nếu đang trỏ vào node bị xóa (hoặc con của nó)
    const curSelected = this._selectedId$.value;
    if (curSelected && toDelete.has(curSelected)) this._selectedId$.next(null);

    const curHover = this._hoverId$.value;
    if (curHover && toDelete.has(curHover)) this._hoverId$.next(null);
  }

  toggleNodeVisible(
    nodeId: string,
    mode: EditorMode,
    scope: 'mode' | 'base' | 'override' = 'mode'
  ) {
    const s = this._schema$.value;
    if (!s) return;

    const n = s.nodes?.[nodeId];
    if (!n) return;

    const base = n.props?.base ?? {};
    const overrides = n.props?.overrides ?? {};
    const ovForMode = overrides?.[mode] ?? {};

    // current visibility theo computed (mode override > base)
    const curVisible = ((ovForMode as any).isVisible ?? (base as any).isVisible) !== false;
    const nextVisible = !curVisible;

    // clone props shell
    const nextProps = {
      base: { ...base } as any,
      overrides: { ...overrides } as any,
    };

    const writeVisible = (target: any) => {
      if (nextVisible) {
        // show => remove key to keep schema clean
        delete target.isVisible;
      } else {
        // hide => store false
        target.isVisible = false;
      }
    };

    if (scope === 'base') {
      writeVisible(nextProps.base);
    } else {
      // scope === 'mode' | 'override'
      const nextOv = { ...(nextProps.overrides?.[mode] ?? {}) } as any;
      writeVisible(nextOv);
      nextProps.overrides = { ...(nextProps.overrides ?? {}), [mode]: nextOv };
    }

    const nextSchema: PageSchema = {
      ...s,
      nodes: {
        ...s.nodes,
        [nodeId]: { ...n, props: nextProps },
      },
    };

    this._schema$.next(nextSchema);
  }

  isNodeVisible(nodeId: string, mode: EditorMode): boolean {
    const s = this._schema$.value;
    const n = s?.nodes?.[nodeId];
    if (!s || !n) return true;

    const base = n.props?.base ?? {};
    const ov = n.props?.overrides?.[mode] ?? {};
    const merged = {...base, ...ov};
    return merged.isVisible !== false;
  }

  // ===== right panel =====

  isRootNodeId(nodeId: string, s: PageSchema): boolean {
    // nếu bạn có zones => ưu tiên dùng zones
    const roots = this.getZoneRoots(s); // bạn đã có
    return nodeId === roots.header || nodeId === roots.body || nodeId === roots.footer;
  }

  duplicateNodeById(nodeId: string) {
    const s = this._schema$.value;
    if (!s) return;

    const parentMap = this.buildParentMap(s);
    const parentId = parentMap[nodeId];
    if (!parentId) return; // root thì bỏ

    const parent = s.nodes[parentId];
    if (!parent) return;

    const fromIndex = (parent.children ?? []).indexOf(nodeId);
    const insertIndex = fromIndex < 0 ? (parent.children ?? []).length : fromIndex + 1;

    const cloned = this.cloneSubtree(nodeId, s);

    const nextParentChildren = [...(parent.children ?? [])];
    nextParentChildren.splice(insertIndex, 0, cloned.rootId);

    const next: PageSchema = {
      ...s,
      nodes: {
        ...s.nodes,
        ...cloned.nodes,
        [parentId]: { ...parent, children: nextParentChildren },
      },
    };

    this._schema$.next(next);
    this.select(cloned.rootId);
    this.hover(cloned.rootId);
  }

  private cloneSubtree(rootId: string, s: PageSchema): { rootId: string; nodes: Record<string, SchemaNode> } {
    const idMap = new Map<string, string>();
    const out: Record<string, SchemaNode> = {};

    const dfs = (oldId: string): string => {
      const oldNode = s.nodes[oldId];
      if (!oldNode) return oldId;

      const newId = this.genNodeId(oldNode.type, s); // bạn đã có
      idMap.set(oldId, newId);

      const newChildren = (oldNode.children ?? []).map((cid) => dfs(cid));

      out[newId] = {
        ...oldNode,
        id: newId,
        children: newChildren,
        props: oldNode.props
          ? {
            base: { ...(oldNode.props.base ?? {}) },
            overrides: { ...(oldNode.props.overrides ?? {}) },
          }
          : { base: {} as any, overrides: {} as any },
      };

      return newId;
    };

    const newRootId = dfs(rootId);
    return { rootId: newRootId, nodes: out };
  }

  patchNodeProps(
    nodeId: string,
    patch: Partial<NodePropsBase>,
    scope: PropsScope,
    mode: EditorMode
  ) {
    const s = this._schema$.value;
    if (!s) return;
    const n = s.nodes?.[nodeId];
    if (!n) return;

    const curProps = n.props ?? { base: {} as any, overrides: {} as any };
    const base = curProps.base ?? ({} as any);
    const overrides = curProps.overrides ?? ({} as any);
    const ovForMode = overrides[mode] ?? {};

    console.log('[PATCH]', { nodeId, scope, mode, patch });

    const nextProps =
      scope === 'base'
        ? {
          ...curProps,
          base: { ...base, ...patch },
        }
        : {
          ...curProps,
          base,
          overrides: {
            ...overrides,
            [mode]: { ...ovForMode, ...patch },
          },
        };

    const nextSchema: PageSchema = {
      ...s,
      nodes: {
        ...s.nodes,
        [nodeId]: { ...n, props: nextProps },
      },
    };

    this._schema$.next(nextSchema);
  }

  /** Xóa override của mode (reset) */
  clearOverride(nodeId: string, mode: EditorMode) {
    const s = this._schema$.value;
    if (!s) return;
    const n = s.nodes?.[nodeId];
    if (!n?.props?.overrides?.[mode]) return;

    const { [mode]: _removed, ...rest } = n.props.overrides;

    const nextSchema: PageSchema = {
      ...s,
      nodes: {
        ...s.nodes,
        [nodeId]: {
          ...n,
          props: {
            ...n.props,
            overrides: rest,
          },
        },
      },
    };

    this._schema$.next(nextSchema);
  }
}
