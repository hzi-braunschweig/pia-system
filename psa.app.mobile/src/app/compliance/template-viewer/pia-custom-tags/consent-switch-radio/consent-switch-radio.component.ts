/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, forwardRef, Input, OnInit } from '@angular/core';
import {
  CustomTagSegment,
  SegmentType,
  TemplateSegment,
} from '../../../segment.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ContainerForFormControlUsageComponent } from '../../container-for-form-control-usage.component';
import { NgFor, NgIf } from '@angular/common';
import { TemplateViewerComponent } from '../../template-viewer.component';

@Component({
  selector: 'app-consent-switch-radio',
  templateUrl: './consent-switch-radio.component.html',
  imports: [NgFor, NgIf, forwardRef(() => TemplateViewerComponent)],
})
export class ConsentSwitchRadioComponent
  extends ContainerForFormControlUsageComponent
  implements OnInit
{
  public consentName: string;
  @Input()
  public groupName: string;
  @Input()
  public segment: CustomTagSegment;
  @Input()
  public form: FormGroup;
  public formControl: FormControl = new FormControl();

  public cases: { value: boolean; segments: TemplateSegment[] }[];

  ngOnInit(): void {
    // create FormGroup if not exists
    if (!this.form.contains(this.groupName)) {
      this.form.addControl(this.groupName, new FormGroup({}));
    }
    const formGroup: FormGroup = this.form.get(this.groupName) as FormGroup;
    // resolve name for variable if necessary
    const nameAttr = this.segment.attrs.find((attr) => attr.name === 'name');
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

    this.cases = this.segment.children
      .filter((child) => child.type === SegmentType.CUSTOM_TAG && child.attrs)
      .map((child: CustomTagSegment) => {
        const valueAttr = child.attrs.find((attr) => attr.name === 'value');
        return {
          value: valueAttr.value === 'true',
          segments: child.children,
        };
      });
  }
}
