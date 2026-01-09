import {ChangeDetectionStrategy, Component, inject, Input} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {RightPanelVm} from '../../editor-right-panel.component';
import {RpPanelFacade} from '../../services/rp-panel-facade.service';

@Component({
  selector: 'app-rp-panel-container',
  templateUrl: './rp-panel-container.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RpPanelContainerComponent {
  @Input({required: true}) vm!: RightPanelVm;
  @Input({required: true}) form!: FormGroup;

  rp = inject(RpPanelFacade);
  // ===== Background =====
  setBgType(type: 'COLOR' | 'IMAGE') {
    this.form.patchValue({bgType: type}, {emitEvent: true});

    if (type === 'COLOR') {
      // clear image when switching to color
      this.form.patchValue({bgImageUrl: ''}, {emitEvent: true});
    } else {
      // clear color when switching to image (tuỳ bạn)
      // this.form.patchValue({ bgColor: '#ffffff00' }, { emitEvent: true });
    }
  }

  clearBgColor() {
    this.form.patchValue({bgColor: ''}, {emitEvent: true});
  }

  private toNumOrNull(v: any): number | null {
    if (v === '' || v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
}
