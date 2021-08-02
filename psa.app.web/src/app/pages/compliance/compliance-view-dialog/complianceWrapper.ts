/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TemplateSegment } from '../../../psa.app.core/models/Segments';
import { FormControl, FormGroup } from '@angular/forms';
import { ComplianceDataResponse } from '../../../psa.app.core/models/compliance';

export class ComplianceWrapper {
  complianceText: string = null; // filled only in edit Mode
  complianceTextObject: TemplateSegment[] = null; // filled only if compliance needed and must be filled by current role
  readonly form: FormGroup;
  usedFormControls: Map<string, string[]>;
  private complianceData: ComplianceDataResponse | null;
  private readonly consentSystem: FormGroup;
  private readonly textSystem: FormGroup;
  private readonly consentGeneric: FormGroup;
  private readonly textGeneric: FormGroup;

  constructor() {
    this.consentSystem = new FormGroup({});
    this.textSystem = new FormGroup({});
    this.consentGeneric = new FormGroup({});
    this.textGeneric = new FormGroup({});
    this.form = new FormGroup({
      consentSystem: this.consentSystem,
      textSystem: this.textSystem,
      consentGeneric: this.consentGeneric,
      textGeneric: this.textGeneric,
    });
  }

  setComplianceData(data: ComplianceDataResponse | null): void {
    this.complianceData = data;
    if (data) {
      // if compliance exists show it and disable the form
      this.form.disable(); // this is currently not working because of https://github.com/angular/angular/issues/22556
      this.complianceTextObject = data.compliance_text_object;
      Object.entries(data.textfields).forEach(([key, value]) =>
        this.textSystem.addControl(
          key,
          new FormControl({ value, disabled: true })
        )
      );
      this.textSystem.addControl(
        'date',
        new FormControl({ value: data.timestamp, disabled: true })
      );
      Object.entries(data.compliance_system).forEach(([key, value]) =>
        this.consentSystem.addControl(
          key,
          new FormControl({ value, disabled: true })
        )
      );
      data.compliance_questionnaire.forEach(({ name, value }) => {
        if (typeof value === 'boolean') {
          this.consentGeneric.addControl(
            name,
            new FormControl({ value, disabled: true })
          );
        } else {
          this.textGeneric.addControl(
            name,
            new FormControl({ value, disabled: true })
          );
        }
      });
    }
  }
}
