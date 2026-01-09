import {ChangeDetectionStrategy, Component, inject, Input} from '@angular/core';
import { FormGroup } from '@angular/forms';
import {RightPanelVm} from '../../editor-right-panel.component';
import {RpPanelFacade} from '../../services/rp-panel-facade.service';

@Component({
  selector: 'app-rp-panel-card',
  templateUrl: './rp-panel-card.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RpPanelCardComponent {
  @Input({ required: true }) vm!: RightPanelVm;
  @Input({ required: true }) form!: FormGroup;

  @Input() kind: 'product' | 'blog' = 'product';
  rp = inject(RpPanelFacade);

  setBgType(type: 'COLOR' | 'IMAGE') {
    this.form.patchValue({ bgType: type }, { emitEvent: true });
    if (type === 'COLOR') this.form.patchValue({ bgImageUrl: '' }, { emitEvent: true });
  }
  clearBgColor() {
    this.form.patchValue({ bgColor: '' }, { emitEvent: true });
  }
  private toNumOrNull(v: any): number | null {
    if (v === '' || v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
}
