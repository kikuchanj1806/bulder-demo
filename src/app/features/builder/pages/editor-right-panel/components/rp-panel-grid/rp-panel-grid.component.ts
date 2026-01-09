import {ChangeDetectionStrategy, Component, inject, Input} from '@angular/core';
import { FormGroup } from '@angular/forms';
import {RightPanelVm} from '../../editor-right-panel.component';
import {RpPanelFacade} from '../../services/rp-panel-facade.service';

@Component({
  selector: 'app-rp-panel-grid',
  templateUrl: './rp-panel-grid.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RpPanelGridComponent {
  @Input({ required: true }) vm!: RightPanelVm;
  @Input({ required: true }) form!: FormGroup;

  rp = inject(RpPanelFacade);
  setBgType(type: 'COLOR' | 'IMAGE') {
    this.form.patchValue({ bgType: type }, { emitEvent: true });
    if (type === 'COLOR') this.form.patchValue({ bgImageUrl: '' }, { emitEvent: true });
  }
  clearBgColor() {
    this.form.patchValue({ bgColor: '' }, { emitEvent: true });
  }
}
