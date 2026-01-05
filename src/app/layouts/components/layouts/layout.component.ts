import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-layout',
  templateUrl: 'layout.component.html',
  styleUrls: ['layout.component.scss'],
  standalone: false
})
export class LayoutComponent implements OnInit {
  @Input() leftSize = 22;
  @Input() canvasSize = 56;
  @Input() rightSize = 22;

  @Input() leftMin = 16;
  @Input() rightMin = 16;
  @Input() canvasMin = 40;

  ngOnInit() {
    console.log('11')
  }
}
