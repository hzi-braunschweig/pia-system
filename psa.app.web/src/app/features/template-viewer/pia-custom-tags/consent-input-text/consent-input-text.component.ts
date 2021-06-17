import { Component, Input, OnInit } from '@angular/core';
import { ConsentInputRadioComponent } from '../consent-input-radio/consent-input-radio.component';

@Component({
  selector: 'app-consent-input-text',
  templateUrl: './consent-input-text.component.html',
})
export class ConsentInputTextComponent
  extends ConsentInputRadioComponent
  implements OnInit
{
  @Input()
  public label: string;

  ngOnInit(): void {
    super.ngOnInit();
    // resolve label for input field if necessary
    const labelAttr = this.resolveAttr('label');
    if (labelAttr) {
      this.label = labelAttr.value;
    }
  }
}
