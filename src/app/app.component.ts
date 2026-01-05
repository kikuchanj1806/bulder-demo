import {Component, signal, ViewEncapsulation} from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  template: `<router-outlet></router-outlet>`,
  standalone: false,
  styles: [`
    :host { display: block; height: 100%; }
  `],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  protected readonly title = signal('ui-platform-fe');
}
