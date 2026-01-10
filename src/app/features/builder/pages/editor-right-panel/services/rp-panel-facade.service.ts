import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Injectable()
export class RpPanelFacade {
  private form!: FormGroup;

  // ✅ Parent gọi 1 lần
  attachForm(form: FormGroup) {
    this.form = form;
  }

  // =====================
  // Radius
  // =====================
  setRadiusMode(mode: 'ALL' | 'CORNERS') {
    this.form.patchValue({ radiusMode: mode }, { emitEvent: true });
    this.applyRadiusModeControls(mode); // ✅ CHANGED: centralize

    // Optional seed khi chuyển mode (giữ giống bạn đang làm)
    if (mode === 'ALL') {
      const v = this.form.get('radiusAll')?.value;
      const n = (v == null || v === '') ? 0 : Number(v) || 0;
      this.form.patchValue(
        { radiusTL: n, radiusTR: n, radiusBR: n, radiusBL: n },
        { emitEvent: false }
      );
    } else {
      const all = this.form.get('radiusAll')?.value;
      const seed = (all == null || all === '') ? 0 : Number(all) || 0;

      this.form.patchValue(
        {
          radiusTL: this.form.get('radiusTL')?.value ?? seed,
          radiusTR: this.form.get('radiusTR')?.value ?? seed,
          radiusBR: this.form.get('radiusBR')?.value ?? seed,
          radiusBL: this.form.get('radiusBL')?.value ?? seed,
        },
        { emitEvent: false }
      );
    }
  }

  applyRadiusModeControls(mode: 'ALL' | 'CORNERS') {
    const all = this.form.get('radiusAll');
    const tl = this.form.get('radiusTL');
    const tr = this.form.get('radiusTR');
    const br = this.form.get('radiusBR');
    const bl = this.form.get('radiusBL');

    if (!all || !tl || !tr || !br || !bl) return;

    if (mode === 'ALL') {
      all.enable({ emitEvent: false });
      tl.disable({ emitEvent: false });
      tr.disable({ emitEvent: false });
      br.disable({ emitEvent: false });
      bl.disable({ emitEvent: false });
    } else {
      all.disable({ emitEvent: false });
      tl.enable({ emitEvent: false });
      tr.enable({ emitEvent: false });
      br.enable({ emitEvent: false });
      bl.enable({ emitEvent: false });
    }
  }

  // =====================
  // Padding
  // =====================
  setPaddingMode(mode: 'ALL' | 'SIDES') {
    this.form.patchValue({ paddingMode: mode }, { emitEvent: true });
    this.applyPaddingModeControls(mode);

    if (mode === 'ALL') {
      const v = this.toNumOrNull(this.form.get('paddingAll')?.value);
      this.form.patchValue(
        { paddingTop: v, paddingRight: v, paddingBottom: v, paddingLeft: v },
        { emitEvent: false }
      );
    } else {
      const all = this.toNumOrNull(this.form.get('paddingAll')?.value);
      this.form.patchValue(
        {
          paddingTop: this.form.get('paddingTop')?.value ?? all,
          paddingRight: this.form.get('paddingRight')?.value ?? all,
          paddingBottom: this.form.get('paddingBottom')?.value ?? all,
          paddingLeft: this.form.get('paddingLeft')?.value ?? all,
        },
        { emitEvent: false }
      );
    }
  }

  applyPaddingModeControls(mode: 'ALL' | 'SIDES') {
    const all = this.form.get('paddingAll');
    const top = this.form.get('paddingTop');
    const right = this.form.get('paddingRight');
    const bottom = this.form.get('paddingBottom');
    const left = this.form.get('paddingLeft');

    if (mode === 'ALL') {
      all?.enable({ emitEvent: false });
      top?.disable({ emitEvent: false });
      right?.disable({ emitEvent: false });
      bottom?.disable({ emitEvent: false });
      left?.disable({ emitEvent: false });
    } else {
      all?.disable({ emitEvent: false });
      top?.enable({ emitEvent: false });
      right?.enable({ emitEvent: false });
      bottom?.enable({ emitEvent: false });
      left?.enable({ emitEvent: false });
    }
  }

  // =====================
  // Margin
  // =====================
  setMarginMode(mode: 'ALL' | 'SIDES') {
    this.form.patchValue({ marginMode: mode }, { emitEvent: true });
    this.applyMarginModeControls(mode);

    if (mode === 'ALL') {
      const v = this.toNumOrNull(this.form.get('marginAll')?.value);
      this.form.patchValue(
        { marginTop: v, marginRight: v, marginBottom: v, marginLeft: v },
        { emitEvent: false }
      );
    } else {
      const all = this.toNumOrNull(this.form.get('marginAll')?.value);
      this.form.patchValue(
        {
          marginTop: this.form.get('marginTop')?.value ?? all,
          marginRight: this.form.get('marginRight')?.value ?? all,
          marginBottom: this.form.get('marginBottom')?.value ?? all,
          marginLeft: this.form.get('marginLeft')?.value ?? all,
        },
        { emitEvent: false }
      );
    }
  }

  applyMarginModeControls(mode: 'ALL' | 'SIDES') {
    const all = this.form.get('marginAll');
    const top = this.form.get('marginTop');
    const right = this.form.get('marginRight');
    const bottom = this.form.get('marginBottom');
    const left = this.form.get('marginLeft');

    if (mode === 'ALL') {
      all?.enable({ emitEvent: false });
      top?.disable({ emitEvent: false });
      right?.disable({ emitEvent: false });
      bottom?.disable({ emitEvent: false });
      left?.disable({ emitEvent: false });
    } else {
      all?.disable({ emitEvent: false });
      top?.enable({ emitEvent: false });
      right?.enable({ emitEvent: false });
      bottom?.enable({ emitEvent: false });
      left?.enable({ emitEvent: false });
    }
  }

  // =====================
  // Background
  // =====================
  setBgType(type: 'COLOR' | 'IMAGE') {
    this.form.patchValue({ bgType: type }, { emitEvent: true });

    // ✅ clear bên không dùng
    if (type === 'COLOR') {
      this.form.patchValue({ bgImageUrl: '' }, { emitEvent: true });
    } else {
      this.form.patchValue({ bgColor: '#ffffff00' }, { emitEvent: true });
    }
  }

  clearBgColor() {
    this.form.patchValue({ bgColor: '' }, { emitEvent: true });
  }

  // =====================
  // Helpers
  // =====================
  private toNum(v: any, fallback = 0): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  private toNumOrNull(v: any): number | null {
    if (v === '' || v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
}
