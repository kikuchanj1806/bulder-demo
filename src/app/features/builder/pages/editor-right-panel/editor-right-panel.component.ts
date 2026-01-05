import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {EditorMode, NodePropsBase, NodeType, PageSchema, SchemaNode} from '../../mocks/home.schema.mock';
import {EditorStateService, EditorToolMode} from '../../state/editor-state.service';

export type RightPanelScope = 'mode' | 'base';

export type RightPanelVm = {
  schema: PageSchema | null;
  selectedId: string | null;
  mode: EditorMode;
  toolMode: EditorToolMode;

  node: SchemaNode | null;

  computed: NodePropsBase | null; // <-- CHANGED: dùng computed thay cho props

  isVisible: boolean;
  isRoot: boolean;

  scope: RightPanelScope;

  // ✅ Step 3.1: gating flags
  hasSelection: boolean;
  isSelectMode: boolean;
  canEdit: boolean;
  canMutate: boolean;
  readonlyReason: string | null;
};
@Component({
  selector: 'app-editor-right-panel',
  templateUrl: './editor-right-panel.component.html',
  styleUrls: ['./editor-right-panel.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorRightPanelComponent implements OnInit {
  readonly state = inject(EditorStateService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  private scope$ = new BehaviorSubject<RightPanelScope>('mode');
  private lastLoadKey = '';

  form: FormGroup = this.fb.group({
    // common
    isVisible: [true],
    gap: [null],
    radius: [null],

    // container
    direction: ['COLUMN'],
    columns: [null],

    // text
    content: [''],
    fontSize: [null],
    fontWeight: [null],

    // image / card
    imageUrl: [''],
    title: [''],
    price: [''],
  });

  setScope(scope: RightPanelScope) {
    this.scope$.next(scope);
  }

  vm$ = combineLatest([
    this.state.schema$,
    this.state.selectedId$,
    this.state.mode$,
    this.state.toolMode$,
    this.scope$,
  ]).pipe(
    map(([schema, selectedId, mode, toolMode, scope]): RightPanelVm => {
      const isSelectMode = toolMode === 'select';

      const node = (schema && selectedId) ? (schema.nodes[selectedId] ?? null) : null;
      const hasSelection = !!schema && !!selectedId && !!node;

      const computed = (hasSelection && selectedId)
        ? this.state.resolveProps(selectedId, mode)
        : null;

      const isVisible = (hasSelection && selectedId)
        ? this.state.isNodeVisible(selectedId, mode)
        : true;

      const isRoot = (hasSelection && selectedId)
        ? this.state.isRootNodeId(selectedId, schema!)
        : false;

      let readonlyReason: string | null = null;
      if (!hasSelection) readonlyReason = 'Chưa chọn node.';
      else if (!isSelectMode) readonlyReason = 'Đang ở Preview mode (Read-only). Bật Select mode để chỉnh sửa.';
      else if (isRoot) readonlyReason = 'Root node bị khoá thao tác để tránh hỏng layout.';

      // Step 3.1 policy
      const canEdit = hasSelection && isSelectMode;          // form enable/disable
      const canMutate = hasSelection && isSelectMode && !isRoot; // hide/dup/del

      return {
        schema,
        selectedId,
        mode,
        toolMode,
        node,
        computed,
        isVisible,
        isRoot,
        scope,
        hasSelection,
        isSelectMode,
        canEdit,
        canMutate,
        readonlyReason,
      };
    })
  );

  ngOnInit() {
    // 1) load form khi đổi selected/mode/scope
    this.vm$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((vm) => {
        // NOTE: chỉ gating enable/disable, không thay đổi logic patch form step trước
        if (!vm.canEdit) {
          this.form.disable({ emitEvent: false });
        } else {
          this.form.enable({ emitEvent: false });
        }
      });

    // 2) autosave
    this.form.valueChanges
      .pipe(
        debounceTime(150),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((v) => {
        const s = this.state.schemaSnapshot;
        const selectedId = this.state.selectedIdSnapshot;
        const mode = this.state.modeSnapshot;
        const scope = this.scope$.value;

        if (!s || !selectedId) return;
        const node = s.nodes[selectedId];
        if (!node) return;

        const patch = this.mapFormToProps(node.type, v);

        this.state.patchNodeProps(
          selectedId,
          patch,
          scope === 'base' ? 'base' : 'override',
          mode
        );
      });
  }

  onToggleVisible(vm: RightPanelVm) {
    if (!vm.selectedId || !vm.canMutate) return;
    this.state.toggleNodeVisible(vm.selectedId, vm.mode, vm.scope);
  }

  onDuplicate(vm: RightPanelVm) {
    if (!vm.selectedId || !vm.canMutate) return;
    this.state.duplicateNodeById(vm.selectedId);
  }

  onDelete(vm: RightPanelVm) {
    if (!vm.selectedId || !vm.canMutate) return;
    this.state.removeNodeById(vm.selectedId);
  }

  onResetOverride(vm: RightPanelVm) {
    if (!vm.selectedId || !vm.canEdit) return;
    if (vm.scope !== 'mode') return;
    this.state.clearOverride(vm.selectedId, vm.mode);
  }

  private mapFormToProps(type: NodeType, v: any): Partial<NodePropsBase> {
    // patch cho base/override
    const patch: any = {
      isVisible: v.isVisible !== false,
    };

    // common: null => xoá key (patchNodeProps sẽ handle)
    patch.gap = v.gap != null && v.gap !== '' ? Number(v.gap) : null;
    patch.radius = v.radius != null && v.radius !== '' ? Number(v.radius) : null;

    // BLOCK/LIST
    if (type === 'BLOCK' || type === 'LIST') {
      patch.direction = v.direction ?? 'COLUMN';
    }

    // GRID
    if (type === 'GRID') {
      patch.columns = v.columns != null && v.columns !== '' ? Number(v.columns) : null;
    }

    // TEXT
    if (type === 'TEXT') {
      patch.content = v.content ?? '';
      patch.fontSize = v.fontSize != null && v.fontSize !== '' ? Number(v.fontSize) : null;
      patch.fontWeight = v.fontWeight ?? null;
    }

    // IMAGE / CARD
    if (type === 'IMAGE' || type === 'PRODUCT_CARD' || type === 'BLOG_CARD') {
      patch.imageUrl = v.imageUrl ?? '';
    }
    if (type === 'PRODUCT_CARD' || type === 'BLOG_CARD') {
      patch.title = v.title ?? '';
    }
    if (type === 'PRODUCT_CARD') {
      patch.price = v.price ?? '';
    }

    return patch;
  }

  toJson(v: any): string {
    return JSON.stringify(v ?? null, null, 2);
  }
}
