/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { from, merge, Observable } from 'rxjs';
import { ComplianceManager } from './compliance-manager.service';
import { ComplianceType } from '../psa.app.core/models/compliance';
import { CurrentUser } from './current-user.service';
import { mergeMap } from 'rxjs/operators';
import { FeedbackStatisticsService } from '../pages/feedback-statistics/feedback-statistics.service';

export interface Page {
  name: string;
  path: string[];
  subpaths: string[];
}

@Injectable({
  providedIn: 'root',
})
export class PageManager {
  public readonly navPages$: Observable<Page[]>;

  constructor(
    private user: CurrentUser,
    private complianceManager: ComplianceManager,
    private feedbackStatisticsService: FeedbackStatisticsService
  ) {
    this.navPages$ = merge(
      from(this.getNavigationPagesForCurrentUser()),
      this.complianceManager.complianceDataChangesObservable.pipe(
        mergeMap(() => from(this.getNavigationPagesForCurrentUser()))
      )
    );
  }

  private async getNavigationPagesForCurrentUser(): Promise<Page[]> {
    let pages = [];
    if (this.user.hasRole('Forscher')) {
      pages = [
        {
          name: 'SIDENAV.STUDY',
          path: ['study'],
          subpaths: ['study', 'study/'],
        },
        {
          name: 'SIDENAV.ADMINISTRATION',
          path: ['questionnaires/admin'],
          subpaths: [
            'questionnaires/',
            'questionnaire/',
            'questionnaire',
            'edit',
          ],
        },
        {
          name: 'SIDENAV.PROBANDS',
          path: ['probands'],
          subpaths: [
            'probands',
            'questionnaireInstances/',
            'laboratory-results;user_id=',
            'sample-management/',
            'view',
          ],
        },
        {
          name: 'SIDENAV.COMPLIANCE',
          path: ['compliance/setup'],
          subpaths: ['compliance/'],
        },
        {
          name: 'SIDENAV.FEEDBACK_STATISTICS',
          path: ['feedback-statistics'],
          subpaths: ['feedback-statistics/', 'feedback-statistics/edit'],
        },
      ];
    } else if (this.user.hasRole('Untersuchungsteam')) {
      pages = [
        {
          name: 'SIDENAV.STUDY',
          path: ['study'],
          subpaths: ['study', 'study/'],
        },
        {
          name: 'SIDENAV.PROBANDS',
          path: ['probands'],
          subpaths: [
            'probands',
            'probands/',
            'sample-management/',
            'questionnaires/user?user_id',
            'questionnaire/',
          ],
        },
        {
          name: 'SIDENAV.PLANNED_PROBANDS',
          path: ['planned-probands'],
          subpaths: ['planned-probands/'],
        },
        {
          name: 'SIDENAV.COMPLIANCE_MANAGEMENT',
          path: ['compliance/management'],
          subpaths: ['compliance/'],
        },
      ];
    } else if (this.user.hasRole('SysAdmin')) {
      pages = [
        { name: 'SIDENAV.HOME', path: ['home'], subpaths: ['home'] },
        {
          name: 'SIDENAV.USER_ADMINISTRATION',
          path: ['internalUsers'],
          subpaths: ['internalUsers'],
        },
        {
          name: 'SIDENAV.STUDIES',
          path: ['studies'],
          subpaths: ['studies', 'studies/Evaluation/users'],
        },
        {
          name: 'SIDENAV.LOGS',
          path: ['deletelogs'],
          subpaths: ['deletelogs'],
        },
      ];
    } else if (this.user.hasRole('ProbandenManager')) {
      pages = [
        {
          name: 'SIDENAV.STUDY',
          path: ['study'],
          subpaths: ['study', 'study/'],
        },
        {
          name: 'SIDENAV.PROBANDS',
          path: ['probands-personal-info'],
          subpaths: [
            'probands-personal-info',
            'probands-personal-info/',
            'questionnaireInstances/',
          ],
        },
        {
          name: 'SIDENAV.SAMPLE_MANAGEMENT',
          path: ['sample-management'],
          subpaths: ['sample-management', 'sample-management/'],
        },
        {
          name: 'SIDENAV.CONTACT_PROBAND',
          path: ['contact-proband'],
          subpaths: ['contact-proband'],
        },
        {
          name: 'SIDENAV.PROBANDS_TO_CONTACT',
          path: ['probands-to-contact'],
          subpaths: ['probands-to-contact', 'probands-to-contact/'],
        },
      ];
    } else if (this.user.hasRole('EinwilligungsManager')) {
      pages = [
        {
          name: 'SIDENAV.STUDY',
          path: ['study'],
          subpaths: ['study', 'study/'],
        },
        {
          name: 'SIDENAV.COMPLIANCE',
          path: ['compliance/view'],
          subpaths: ['compliance/'],
        },
      ];
    } else if (this.user.isProband()) {
      pages = [];
      pages.push({ name: 'SIDENAV.HOME', path: ['home'], subpaths: ['home'] });
      pages.push({
        name: 'SIDENAV.QUESTIONNAIRES',
        path: ['questionnaires/user'],
        subpaths: ['questionnaires/', 'questionnaire/'],
      });

      let userHasCompliances = false;
      try {
        userHasCompliances = await this.complianceManager.userHasCompliances([
          ComplianceType.LABRESULTS,
        ]);
      } catch (e) {
        console.error(
          'Could not get userHasCompliances from complianceManager. Tab LABORATORY_RESULTS will be hidden. ',
          e
        );
      }
      if (userHasCompliances) {
        pages.push({
          name: 'SIDENAV.LABORATORY_RESULTS',
          path: ['laboratory-results'],
          subpaths: ['laboratory-results'],
        });
      }

      let hasFeedbackStatisticsForProband = false;
      try {
        hasFeedbackStatisticsForProband =
          await this.feedbackStatisticsService.hasFeedbackStatisticsForProband();
      } catch (e) {
        console.error(
          'Could not get hasFeedbackStatisticsForProband from feedbackStatisticsService. Tab FEEDBACK_STATISTICS will be hidden. ',
          e
        );
      }
      if (hasFeedbackStatisticsForProband) {
        pages.push({
          name: 'SIDENAV.FEEDBACK_STATISTICS',
          path: ['feedback-statistics'],
          subpaths: ['feedback-statistics/'],
        });
      }

      let isInternalComplianceActive = false;
      try {
        isInternalComplianceActive =
          await this.complianceManager.isInternalComplianceActive();
      } catch (e) {
        console.error(
          'Could not get isInternalComplianceActive from complianceManager. Tab COMPLIANCE will be hidden. ',
          e
        );
      }

      if (isInternalComplianceActive) {
        pages.push({
          name: 'SIDENAV.COMPLIANCE',
          path: ['compliance/agree'],
          subpaths: ['compliance/'],
        });
      }
      pages.push({
        name: 'SIDENAV.SETTINGS',
        path: ['settings'],
        subpaths: ['settings'],
      });
      pages.push({
        name: 'SIDENAV.CONTACT',
        path: ['contact'],
        subpaths: ['contact'],
      });
    }
    return pages;
  }
}
