import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  @Input()
  title: string;

  @Input()
  isChildPageOf: string;

  @Input()
  disableButtons: boolean;
}
