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
import {
  EditorMode,
  NodePropsBase,
  NodeType,
  PageSchema,
  SchemaNode,
} from '../../mocks/home.schema.mock';
import { EditorStateService, EditorToolMode } from '../../state/editor-state.service';
import {RpPanelFacade} from './services/rp-panel-facade.service';

export type RightPanelScope = 'mode' | 'base';

export type RightPanelVm = {
  schema: PageSchema | null;
  selectedId: string | null;
  mode: EditorMode;
  toolMode: EditorToolMode;

  node: SchemaNode | null;
  computed: NodePropsBase | null;

  isVisible: boolean;
  isRoot: boolean;

  scope: RightPanelScope;

  // Step 3.1 gating
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
  providers: [RpPanelFacade],
})
export class EditorRightPanelComponent implements OnInit {
  readonly state = inject(EditorStateService);
  private rp = inject(RpPanelFacade);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  private scope$ = new BehaviorSubject<RightPanelScope>('mode');
  private lastLoadKey = '';

  // ✅ lưu vm mới nhất để autosave không đọc snapshot rời rạc
  private lastVm: RightPanelVm | null = null;

  form: FormGroup = this.fb.group({
    // ===== Common =====
    isVisible: [true],
    gap: [null],

    // ===== Padding =====
    paddingMode: ['ALL'], // 'ALL' | 'SIDES'
    paddingAll: [null],
    paddingTop: [null],
    paddingRight: [null],
    paddingBottom: [null],
    paddingLeft: [null],

    // ===== Margin =====
    marginMode: ['ALL'], // 'ALL' | 'SIDES'
    marginAll: [null],
    marginTop: [null],
    marginRight: [null],
    marginBottom: [null],
    marginLeft: [null],

    // ===== Radius =====
    radiusMode: ['ALL'], // 'ALL' | 'CORNERS'
    radiusAll: [null],
    radiusTL: [null],
    radiusTR: [null],
    radiusBL: [null],
    radiusBR: [null],

    // ===== Container =====
    direction: ['COLUMN'],
    columns: [null],

    // ===== Text =====
    content: [''],
    fontSize: [null],
    fontWeight: [null],

    // ===== Image / Card =====
    imageUrl: [''],
    title: [''],
    price: [''],

    // ===== Background =====
    bgType: ['COLOR'], // 'COLOR' | 'IMAGE'
    bgColor: ['#ffffff00'],
    bgImageUrl: [''],

    // ===== Link (demo) =====
    linkType: [''],
  });

  vm$ = combineLatest([
    this.state.schema$,
    this.state.selectedId$,
    this.state.mode$,
    this.state.toolMode$,
    this.scope$,
  ]).pipe(
    map(([schema, selectedId, mode, toolMode, scope]): RightPanelVm => {
      const isSelectMode = toolMode === 'select';

      const node =
        schema && selectedId ? schema.nodes[selectedId] ?? null : null;

      const hasSelection = !!schema && !!selectedId && !!node;

      const computed =
        hasSelection && selectedId
          ? this.state.resolveProps(selectedId, mode)
          : null;

      const isVisible =
        hasSelection && selectedId
          ? this.state.isNodeVisible(selectedId, mode)
          : true;

      const isRoot =
        hasSelection && selectedId
          ? this.state.isRootNodeId(selectedId, schema!)
          : false;

      let readonlyReason: string | null = null;
      if (!hasSelection) readonlyReason = 'Chưa chọn node.';
      else if (!isSelectMode)
        readonlyReason =
          'Đang ở Preview mode (Read-only). Bật Select mode để chỉnh sửa.';
      else if (isRoot)
        readonlyReason =
          'Root node bị khoá thao tác để tránh hỏng layout.';

      const canEdit = hasSelection && isSelectMode; // form enable/disable
      const canMutate = hasSelection && isSelectMode && !isRoot; // actions

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
    this.rp.attachForm(this.form);
    // ===== 1) Load form khi đổi selectedId|mode|scope =====
    this.vm$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((vm) => {
        this.lastVm = vm;

        // Step 3.1 gating
        if (!vm.canEdit) this.form.disable({ emitEvent: false });
        else this.form.enable({ emitEvent: false });

        if (!vm.node || !vm.selectedId) return;

        const key = `${vm.selectedId}|${vm.mode}|${vm.scope}`;
        if (key !== this.lastLoadKey) {
          this.lastLoadKey = key;

          const src = vm.computed ?? {};
          this.form.patchValue(this.mapPropsToForm(vm.node.type, src), {
            emitEvent: false,
          });

          const rm = (this.form.get('radiusMode')?.value ?? 'ALL') as 'ALL' | 'CORNERS';
          this.rp.applyRadiusModeControls(rm);

          const pm = (this.form.get('paddingMode')?.value ?? 'ALL') as 'ALL' | 'SIDES';
          this.rp.applyPaddingModeControls(pm);

          const mm = (this.form.get('marginMode')?.value ?? 'ALL') as 'ALL' | 'SIDES';
          this.rp.applyMarginModeControls(mm);

          // ✅ rất quan trọng: reset dirty/touched để tránh “dính” sang node khác
          this.form.markAsPristine();
          this.form.markAsUntouched();
        }
      });

    // ===== 2) Autosave: build patch từ dirty =====
    this.form.valueChanges
      .pipe(debounceTime(150), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const vm = this.lastVm;
        if (!vm?.hasSelection || !vm.node || !vm.selectedId) return;
        if (!vm.canEdit) return;
        if (vm.isRoot) return;

        if (!this.form.valid) return;

        const patch = this.buildPatchFromDirty(vm.node.type);
        if (Object.keys(patch).length === 0) return;

        this.state.patchNodeProps(
          vm.selectedId,
          patch,
          vm.scope === 'base' ? 'base' : 'override',
          vm.mode
        );

        this.form.markAsPristine();
      });
  }

  // ===== mapping computed -> form =====
// ===== mapping computed -> form =====
  private mapPropsToForm(type: NodeType, p: Partial<NodePropsBase>) {
    const pad: any = (p as any).padding ?? null;
    const mar: any = (p as any).margin ?? null;
    const bg: any = (p as any).background ?? null;

    const rad: any = (p as any).radius ?? null;

    const padAll =
      pad && pad.top === pad.right && pad.top === pad.bottom && pad.top === pad.left
        ? pad.top
        : null;

    const marAll =
      mar && mar.top === mar.right && mar.top === mar.bottom && mar.top === mar.left
        ? mar.top
        : null;

    const hasRad = !!rad;
    const radAll =
      hasRad && rad.tl === rad.tr && rad.tl === rad.br && rad.tl === rad.bl
        ? rad.tl
        : null;

    const radiusMode: 'ALL' | 'CORNERS' = (radAll != null) ? 'ALL' : 'CORNERS';

    return {
      isVisible: (p as any).isVisible !== false,
      gap: (p as any).gap ?? null,

      // ===== Padding =====
      paddingMode: padAll != null ? 'ALL' : 'SIDES',
      paddingAll: padAll,
      paddingTop: pad?.top ?? null,
      paddingRight: pad?.right ?? null,
      paddingBottom: pad?.bottom ?? null,
      paddingLeft: pad?.left ?? null,

      // ===== Margin =====
      marginMode: marAll != null ? 'ALL' : 'SIDES',
      marginAll: marAll,
      marginTop: mar?.top ?? null,
      marginRight: mar?.right ?? null,
      marginBottom: mar?.bottom ?? null,
      marginLeft: mar?.left ?? null,

      // ===== Radius =====
      // ✅ CHANGED: load đúng từ CornerRadii
      radiusMode,
      radiusAll: radAll,
      radiusTL: rad?.tl ?? null,
      radiusTR: rad?.tr ?? null,
      radiusBR: rad?.br ?? null,
      radiusBL: rad?.bl ?? null,

      // ===== Container =====
      direction: (p as any).direction ?? 'COLUMN',
      columns: (p as any).columns ?? null,

      // ===== Text =====
      content: (p as any).content ?? '',
      fontSize: (p as any).fontSize ?? null,
      fontWeight: (p as any).fontWeight ?? null,

      // ===== Image/Card =====
      imageUrl: (p as any).imageUrl ?? '',
      title: (p as any).title ?? '',
      price: (p as any).price ?? '',

      // ===== Background =====
      bgType: bg?.type ?? 'COLOR',
      bgColor: bg?.type === 'COLOR' ? (bg?.value ?? '#ffffff00') : '#ffffff00',
      bgImageUrl: bg?.type === 'IMAGE' ? (bg?.value ?? '') : '',

      linkType: (p as any).linkType ?? '',
    };
  }

  // ===== build patch từ dirty =====
  private buildPatchFromDirty(type: NodeType): Partial<NodePropsBase> {
    const patch: any = {};
    const c: any = this.form.controls;

    if (c.isVisible?.dirty) patch.isVisible = c.isVisible.value !== false;

    if (c.gap?.dirty) {
      patch.gap = c.gap.value != null && c.gap.value !== '' ? Number(c.gap.value) : null;
    }

// ===== Radius =====
    const radiusDirty =
      c.radiusAll?.dirty || c.radiusMode?.dirty ||
      c.radiusTL?.dirty || c.radiusTR?.dirty || c.radiusBL?.dirty || c.radiusBR?.dirty;

    if (radiusDirty) {
      const mode = (c.radiusMode?.value ?? 'ALL') as 'ALL' | 'CORNERS';

      if (mode === 'ALL') {
        // ✅ ALL: dùng radiusAll, empty => clear
        const raw = c.radiusAll?.value;

        if (raw == null || raw === '') {
          patch.radius = null; // ✅ CHANGED: clear radius override/base
        } else {
          const v = Number(raw) || 0;
          patch.radius = { tl: v, tr: v, br: v, bl: v }; // ✅ CHANGED
        }
      } else {
        // ✅ CORNERS: dùng 4 góc, nếu user clear hết => clear
        const tlRaw = c.radiusTL?.value;
        const trRaw = c.radiusTR?.value;
        const brRaw = c.radiusBR?.value;
        const blRaw = c.radiusBL?.value;

        const allEmpty =
          (tlRaw == null || tlRaw === '') &&
          (trRaw == null || trRaw === '') &&
          (brRaw == null || brRaw === '') &&
          (blRaw == null || blRaw === '');

        if (allEmpty) {
          patch.radius = null; // ✅ clear
        } else {
          const tl = tlRaw != null && tlRaw !== '' ? Number(tlRaw) : 0;
          const tr = trRaw != null && trRaw !== '' ? Number(trRaw) : 0;
          const br = brRaw != null && brRaw !== '' ? Number(brRaw) : 0;
          const bl = blRaw != null && blRaw !== '' ? Number(blRaw) : 0;

          patch.radius = { tl, tr, br, bl }; // ✅ CHANGED: đúng CornerRadii
        }
      }
    }

    // container
    if ((type === 'BLOCK' || type === 'LIST') && c.direction?.dirty) {
      patch.direction = c.direction.value ?? 'COLUMN';
    }
    if (type === 'GRID' && c.columns?.dirty) {
      patch.columns = c.columns.value != null && c.columns.value !== '' ? Number(c.columns.value) : null;
    }

    // padding
    const padDirty =
      c.paddingTop?.dirty || c.paddingRight?.dirty || c.paddingBottom?.dirty || c.paddingLeft?.dirty || c.paddingAll?.dirty || c.paddingMode?.dirty;

    if (padDirty) {
      const top = c.paddingTop.value != null && c.paddingTop.value !== '' ? Number(c.paddingTop.value) : 0;
      const right = c.paddingRight.value != null && c.paddingRight.value !== '' ? Number(c.paddingRight.value) : 0;
      const bottom = c.paddingBottom.value != null && c.paddingBottom.value !== '' ? Number(c.paddingBottom.value) : 0;
      const left = c.paddingLeft.value != null && c.paddingLeft.value !== '' ? Number(c.paddingLeft.value) : 0;
      patch.padding = { top, right, bottom, left };
    }

    // margin
    const marDirty =
      c.marginTop?.dirty || c.marginRight?.dirty || c.marginBottom?.dirty || c.marginLeft?.dirty || c.marginAll?.dirty || c.marginMode?.dirty;

    if (marDirty) {
      const top = c.marginTop.value != null && c.marginTop.value !== '' ? Number(c.marginTop.value) : 0;
      const right = c.marginRight.value != null && c.marginRight.value !== '' ? Number(c.marginRight.value) : 0;
      const bottom = c.marginBottom.value != null && c.marginBottom.value !== '' ? Number(c.marginBottom.value) : 0;
      const left = c.marginLeft.value != null && c.marginLeft.value !== '' ? Number(c.marginLeft.value) : 0;
      patch.margin = { top, right, bottom, left };
    }

    // background
    const bgDirty = c.bgType?.dirty || c.bgColor?.dirty || c.bgImageUrl?.dirty;
    if (bgDirty) {
      const t = (c.bgType?.value ?? 'COLOR') as 'COLOR' | 'IMAGE';
      if (t === 'COLOR') {
        const v = String(c.bgColor?.value ?? '').trim();
        patch.background = v ? { type: 'COLOR', value: v } : null;
      } else {
        const v = String(c.bgImageUrl?.value ?? '').trim();
        patch.background = v ? { type: 'IMAGE', value: v } : null;
      }
    }

    // text
    if (type === 'TEXT') {
      if (c.content?.dirty) patch.content = c.content.value ?? '';
      if (c.fontSize?.dirty) patch.fontSize = c.fontSize.value != null && c.fontSize.value !== '' ? Number(c.fontSize.value) : null;
      if (c.fontWeight?.dirty) patch.fontWeight = c.fontWeight.value ?? null;
    }

    // image/cards
    if (type === 'IMAGE' || type === 'PRODUCT_CARD' || type === 'BLOG_CARD') {
      if (c.imageUrl?.dirty) patch.imageUrl = c.imageUrl.value ?? '';
    }
    if (type === 'PRODUCT_CARD' || type === 'BLOG_CARD') {
      if (c.title?.dirty) patch.title = c.title.value ?? '';
    }
    if (type === 'PRODUCT_CARD') {
      if (c.price?.dirty) patch.price = c.price.value ?? '';
    }

    // link demo
    if (c.linkType?.dirty) patch.linkType = c.linkType.value ?? '';

    return patch;
  }
}
