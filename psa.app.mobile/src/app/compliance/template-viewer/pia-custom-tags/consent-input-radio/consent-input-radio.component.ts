import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Attribute, CustomTagSegment } from '../../../segment.model';

@Component({
  selector: 'app-consent-input-radio',
  templateUrl: './consent-input-radio.component.html',
})
export class ConsentInputRadioComponent implements OnInit, OnDestroy {
  @Input()
  public consentName: string;
  @Input()
  public groupName: string;
  @Input()
  public segment: CustomTagSegment;
  @Input()
  public form: FormGroup;
  @Output()
  public usedFormControls = new EventEmitter<Map<string, string[]>>();
  public formControl: FormControl = new FormControl();

  ngOnInit(): void {
    // create FormGroup if not exists
    if (!this.form.contains(this.groupName)) {
      this.form.addControl(this.groupName, new FormGroup({}));
    }
    const formGroup: FormGroup = this.form.get(this.groupName) as FormGroup;
    // resolve name for variable if necessary
    const nameAttr = this.resolveAttr('name');
    if (nameAttr) {
      this.consentName = nameAttr.value;
    }
    // create FormControl if not exists
    if (!formGroup.contains(this.consentName)) {
      formGroup.addControl(
        this.consentName,
        new FormControl(null, Validators.required)
      );
    }
    this.formControl = formGroup.get(this.consentName) as FormControl;
    const path = [this.groupName, this.consentName];
    this.usedFormControls.emit(new Map([[JSON.stringify(path), path]]));
  }

  protected resolveAttr(name: string): null | Attribute {
    if (this.segment) {
      return this.segment.attrs.find((attr) => attr.name === name);
    }
    return null;
  }

  ngOnDestroy(): void {
    this.usedFormControls.emit(new Map());
  }
}
