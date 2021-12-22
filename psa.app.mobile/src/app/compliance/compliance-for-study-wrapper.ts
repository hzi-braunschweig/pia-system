/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { FormControl, FormGroup } from '@angular/forms';
import { TemplateSegment } from './segment.model';
import {
  ComplianceDataRequest,
  ComplianceDataResponse,
} from './compliance.model';

export class ComplianceForStudyWrapper {
  studyName: string;
  complianceText: string = null; // filled only in edit Mode
  complianceTextObject: TemplateSegment[] = null; // filled only if compliance needed and must be filled by current role
  readonly form: FormGroup;
  usedFormControls: Map<string, string[]>;
  editMode = true;
  private complianceData: ComplianceDataResponse | null;
  private readonly consentSystem: FormGroup;
  private readonly textSystem: FormGroup;
  private readonly consentGeneric: FormGroup;
  private readonly textGeneric: FormGroup;

  constructor(studyName: string) {
    this.studyName = studyName;
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

  cleanFormControls(): void {
    this.deleteAllFormControlsNotInMap(this.usedFormControls, this.form, []);
  }

  private deleteAllFormControlsNotInMap(
    map: Map<string, string[]>,
    form: FormGroup,
    path: string[]
  ): void {
    Object.keys(form.controls).forEach((name: string) => {
      const abstractControl = form.get(name);
      const childPath = path.slice();
      childPath.push(name);
      if (abstractControl instanceof FormGroup) {
        this.deleteAllFormControlsNotInMap(map, abstractControl, childPath);
      } else if (abstractControl instanceof FormControl) {
        const key = JSON.stringify(childPath);
        if (!map.has(key)) {
          form.removeControl(name);
        }
      }
    });
  }

  setComplianceData(data: ComplianceDataResponse | null): void {
    this.complianceData = data;
    if (data) {
      // if compliance exists show it and disable the form
      this.form.disable(); // this is currently not working because of https://github.com/angular/angular/issues/22556
      this.editMode = false; // therefore use editMode variable
      this.complianceTextObject = data.compliance_text_object;
      Object.entries(data.textfields).forEach(([key, value]) =>
        this.textSystem.addControl(key, new FormControl(value))
      );
      this.textSystem.addControl('date', new FormControl(data.timestamp));
      Object.entries(data.compliance_system).forEach(([key, value]) =>
        this.consentSystem.addControl(key, new FormControl(value))
      );
      data.compliance_questionnaire.forEach(({ name, value }) => {
        if (typeof value === 'boolean') {
          this.consentGeneric.addControl(name, new FormControl(value));
        } else {
          this.textGeneric.addControl(name, new FormControl(value));
        }
      });
    } else {
      this.editMode = true;
      const dateControl = new FormControl(new Date().toISOString());
      dateControl.disable();
      this.textSystem.addControl('date', dateControl);
    }
  }

  extractNewComplianceDataFromForm(): ComplianceDataRequest {
    const complianceData: ComplianceDataRequest = {
      compliance_text: this.complianceText,
      textfields: {},
      compliance_system: {},
      compliance_questionnaire: [],
    };
    this.usedFormControls.forEach((path) => {
      switch (path[0]) {
        case 'consentGeneric':
        case 'textGeneric':
          complianceData.compliance_questionnaire.push({
            name: path[1],
            value: this.form.get(path).value,
          });
          break;
        case 'consentSystem':
          complianceData.compliance_system[path[1]] = this.form.get(path).value;
          break;
        case 'textSystem':
          if (path[1] !== 'date') {
            complianceData.textfields[path[1]] = this.form.get(path).value;
          }
          break;
      }
    });
    // fix birthdate to locale independent date
    if (complianceData.textfields && complianceData.textfields.birthdate) {
      const localeBd = new Date(complianceData.textfields.birthdate);
      complianceData.textfields.birthdate = new Date(
        Date.UTC(
          localeBd.getFullYear(),
          localeBd.getMonth(),
          localeBd.getDate()
        )
      );
    }
    return complianceData;
  }
}
