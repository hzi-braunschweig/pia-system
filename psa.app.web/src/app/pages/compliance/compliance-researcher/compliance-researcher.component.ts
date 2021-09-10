/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Studie } from 'src/app/psa.app.core/models/studie';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { ComplianceService } from 'src/app/psa.app.core/providers/compliance-service/compliance-service';
import { AlertService } from 'src/app/_services/alert.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DialogPopUpComponent } from '../../../_helpers/dialog-pop-up';
import { MatDialog } from '@angular/material/dialog';
import { DialogOkCancelComponent } from '../../../_helpers/dialog-ok-cancel';
import { ComplianceTextInEditMode } from '../../../psa.app.core/models/compliance';
import { TemplateSegment } from '../../../psa.app.core/models/Segments';

@Component({
  selector: 'app-compliance-researcher',
  templateUrl: './compliance-researcher.component.html',
  styleUrls: ['./compliance-researcher.component.scss'],
})
export class ComplianceResearcherComponent implements OnInit {
  isLoading = true;
  studies: Studie[];
  newSelectedStudy: Studie;
  selectedStudy: Studie;
  complianceTextFG: FormGroup;
  preview = false;
  previewText: TemplateSegment[];
  previewForm: FormGroup = new FormGroup({});
  @ViewChild('complianceTextarea') complianceTextarea: ElementRef;

  constructor(
    private questionnaireService: QuestionnaireService,
    private alertService: AlertService,
    private complianceService: ComplianceService,
    private dialog: MatDialog
  ) {
    this.complianceTextFG = new FormGroup({
      to_be_filled_by: new FormControl(null, Validators.required),
      compliance_text: new FormControl('', Validators.required),
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      this.studies = (await this.questionnaireService.getStudies()).studies;
    } catch (err) {
      this.alertService.errorObject(err);
    }
    this.isLoading = false;
  }

  /**
   * Set the selected study and load the compliance text with config
   */
  async onSelectStudy(selectedStudy: Studie): Promise<void> {
    this.selectedStudy = selectedStudy;
    this.isLoading = true;
    try {
      const complianceTextObject =
        await this.complianceService.getComplianceTextForEditing(
          this.selectedStudy.name
        );
      this.updateComplianceTextFG(complianceTextObject);
    } catch (err) {
      this.alertService.errorObject(err);
    }
    this.isLoading = false;
  }

  /**
   * Check if app consent placeholder is available. Otherwise ask for agreement.
   */
  async onPublish(): Promise<void> {
    this.complianceTextFG.markAllAsTouched();
    if (
      this.complianceTextFG.value.compliance_text.includes(
        '<pia-consent-input-radio-app></pia-consent-input-radio-app>'
      )
    ) {
      this.doPublish();
    } else {
      this.dialog
        .open(DialogOkCancelComponent, {
          width: '450px',
          data: {
            q: 'COMPLIANCE.PUBLISH_DIALOG_APP_USAGE_NOT_FOUND.HEADING',
            content: 'COMPLIANCE.PUBLISH_DIALOG_APP_USAGE_NOT_FOUND.CONTENT',
          },
        })
        .afterClosed()
        .subscribe((result) => {
          if (result === 'ok') {
            this.doPublish();
          }
        });
    }
  }

  private async doPublish(): Promise<void> {
    try {
      const newComplianceTextObject =
        await this.complianceService.updateComplianceText(
          this.selectedStudy.name,
          this.complianceTextFG.value
        );
      this.updateComplianceTextFG(newComplianceTextObject);
      this.dialog.open(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'COMPLIANCE.PUBLISHED_SUCCESSFULLY',
          isSuccess: true,
        },
      });
    } catch (err) {
      this.alertService.errorObject(err);
    }
  }

  private updateComplianceTextFG(
    complianceTextObject: ComplianceTextInEditMode
  ): void {
    if (!complianceTextObject) {
      this.complianceTextFG.setValue({
        to_be_filled_by: null,
        compliance_text: '',
      });
    } else {
      this.complianceTextFG.setValue(complianceTextObject);
    }
  }

  insertText(text: string): void {
    const cursorPosition = this.complianceTextarea.nativeElement.selectionStart;
    const currentText: string = this.complianceTextFG.value.compliance_text;
    this.complianceTextFG.controls.compliance_text.setValue(
      currentText.slice(0, cursorPosition) +
        text +
        currentText.slice(cursorPosition, currentText.length)
    );
  }

  async togglePreview(): Promise<void> {
    this.preview = !this.preview;
    if (this.preview) {
      const text = this.complianceTextFG.controls.compliance_text.value;
      try {
        this.previewText =
          await this.complianceService.postComplianceTextPreview(text);
      } catch (err) {
        this.alertService.errorObject(err);
      }
    }
  }
}
