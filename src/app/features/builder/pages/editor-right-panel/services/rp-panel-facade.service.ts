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
    // ✅ CHANGED: centralize logic
    this.form.patchValue({ radiusMode: mode }, { emitEvent: true });
    this.applyRadiusModeControls(mode);

    if (mode === 'ALL') {
      const v = this.toNum(this.form.get('radiusAll')?.value, 0);
      this.form.patchValue(
        { radiusTL: v, radiusTR: v, radiusBL: v, radiusBR: v },
        { emitEvent: false } // tránh spam autosave
      );
    } else {
      // CORNERS: nếu corner trống thì seed từ radiusAll
      const seed = this.toNum(this.form.get('radiusAll')?.value, 0);
      this.form.patchValue(
        {
          radiusTL: this.form.get('radiusTL')?.value ?? seed,
          radiusTR: this.form.get('radiusTR')?.value ?? seed,
          radiusBL: this.form.get('radiusBL')?.value ?? seed,
          radiusBR: this.form.get('radiusBR')?.value ?? seed,
        },
        { emitEvent: false }
      );
    }
  }

  applyRadiusModeControls(mode: 'ALL' | 'CORNERS') {
    // ✅ yêu cầu của bạn: icon-btn active => radiusAll disable (khi CORNERS)
    const all = this.form.get('radiusAll');
    const tl = this.form.get('radiusTL');
    const tr = this.form.get('radiusTR');
    const bl = this.form.get('radiusBL');
    const br = this.form.get('radiusBR');

    if (mode === 'ALL') {
      all?.enable({ emitEvent: false });
      tl?.disable({ emitEvent: false });
      tr?.disable({ emitEvent: false });
      bl?.disable({ emitEvent: false });
      br?.disable({ emitEvent: false });
    } else {
      all?.disable({ emitEvent: false });
      tl?.enable({ emitEvent: false });
      tr?.enable({ emitEvent: false });
      bl?.enable({ emitEvent: false });
      br?.enable({ emitEvent: false });
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
