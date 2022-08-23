/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { AlertService } from '../../_services/alert.service';
import { ComplianceManager } from '../../_services/compliance-manager.service';
import { CurrentUser } from '../../_services/current-user.service';
import { ComplianceType } from '../../psa.app.core/models/compliance';
import { StudyAddress } from '../../psa.app.core/models/studyAddress';
import { QuestionnaireService } from '../../psa.app.core/providers/questionnaire-service/questionnaire-service';

@Component({
  templateUrl: 'contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent implements OnInit {
  public addresses: StudyAddress[];
  public noAddresses: string = null;
  public hasSampleCompliance: boolean;

  constructor(
    public readonly user: CurrentUser,
    private readonly translate: TranslateService,
    private readonly alertService: AlertService,
    private readonly questionnaireService: QuestionnaireService,
    private readonly complianceManager: ComplianceManager
  ) {}

  public async ngOnInit(): Promise<void> {
    try {
      this.hasSampleCompliance =
        await this.complianceManager.userHasCompliances([
          ComplianceType.SAMPLES,
        ]);
      this.addresses = await this.questionnaireService.getStudyAddresses();
      if (this.addresses.length === 0) {
        this.noAddresses = this.translate.instant('SIDENAV.NO_CONTACT_INFO');
      }
    } catch (err) {
      this.alertService.errorObject(err);
    }
  }
}
