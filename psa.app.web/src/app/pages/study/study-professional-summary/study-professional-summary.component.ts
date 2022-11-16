/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { Study, StudyStatus } from '../../../psa.app.core/models/study';
import { CurrentUser } from '../../../_services/current-user.service';
import { createRegistrationUrl } from '../study-registration-link';

@Component({
  selector: 'app-study-professional-summary',
  templateUrl: './study-professional-summary.component.html',
  styleUrls: ['./study-professional-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudyProfessionalSummaryComponent {
  @Input()
  public study: Study;

  @Output()
  public editStudy = new EventEmitter();

  @Output()
  public cancelPendingStudyChange = new EventEmitter();

  @Output()
  public editWelcomeMail = new EventEmitter();

  @Output()
  public editWelcomeText = new EventEmitter();

  constructor(public currentUser: CurrentUser) {}

  public mapStudyStatusToCssClass(status: StudyStatus): string {
    switch (status) {
      case 'active':
        return 'study-status-active';
      case 'deletion_pending':
        return 'study-status-deletion-pending';
      case 'deleted':
        return 'study-status-deleted';
    }
  }

  public canUserEdit(): boolean {
    return this.currentUser.hasRole('Forscher');
  }

  public isStudyActive(): boolean {
    return this.study.status === 'active';
  }

  public isStudyConfigurationComplete(): boolean {
    return Boolean(
      this.study.pseudonym_prefix && this.study.pseudonym_suffix_length
    );
  }

  public createRegistrationUrl = () => createRegistrationUrl(this.study);
}
