import { Injectable } from '@angular/core';
import { AuthenticationManager } from './authentication-manager.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { ComplianceManager } from './compliance-manager.service';
import { ComplianceType } from '../psa.app.core/models/compliance';

export interface Page {
  name: string;
  path: string[];
  subpaths: string[];
}

@Injectable({
  providedIn: 'root',
})
export class PageManager {
  private navPagesSubject: BehaviorSubject<Page[]>;
  public readonly navPagesObservable: Observable<Page[]>;

  constructor(
    private auth: AuthenticationManager,
    private complianceManager: ComplianceManager
  ) {
    this.navPagesSubject = new BehaviorSubject<Page[]>([]);
    this.navPagesObservable = this.navPagesSubject.asObservable();
    this.auth.currentUserObservable.subscribe(async (user) => {
      this.navPagesSubject.next(await this.getNavigationPagesForCurrentUser());
    });
    this.complianceManager.complianceDataChangesObservable.subscribe(
      async (studyName) => {
        this.navPagesSubject.next(
          await this.getNavigationPagesForCurrentUser()
        );
      }
    );
  }

  private async getNavigationPagesForCurrentUser(): Promise<Page[]> {
    let pages = [];
    const currentUser = this.auth.currentUser;
    const currentRole = this.auth.currentRole;
    if (!currentUser || !currentRole) {
      return pages;
    }

    if (currentRole === 'Forscher') {
      pages = [
        { name: 'SIDENAV.HOME', path: ['home'], subpaths: ['home'] },
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
        { name: 'SIDENAV.STUDIES', path: ['studies'], subpaths: ['studies'] },
        {
          name: 'SIDENAV.COMPLIANCE',
          path: ['compliance/setup'],
          subpaths: ['compliance/'],
        },
        {
          name: 'SIDENAV.STUDY_WELCOME_TEXT',
          path: ['welcome-text'],
          subpaths: ['welcome-text'],
        },
        { name: 'SIDENAV.LOGS', path: ['logs'], subpaths: ['logs'] },
      ];
    } else if (currentRole === 'Untersuchungsteam') {
      pages = [
        { name: 'SIDENAV.HOME', path: ['home'], subpaths: ['home'] },
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
        { name: 'SIDENAV.STUDIES', path: ['studies'], subpaths: ['studies'] },
        {
          name: 'SIDENAV.COMPLIANCE_MANAGEMENT',
          path: ['compliance/management'],
          subpaths: ['compliance/'],
        },
      ];
    } else if (currentRole === 'SysAdmin') {
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
    } else if (currentRole === 'ProbandenManager') {
      pages = [
        { name: 'SIDENAV.HOME', path: ['home'], subpaths: ['home'] },
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
          name: 'SIDENAV.CONTACTS',
          path: ['contacts'],
          subpaths: ['contacts'],
        },
        {
          name: 'SIDENAV.PROBANDS_TO_CONTACT',
          path: ['probands-to-contact'],
          subpaths: ['probands-to-contact', 'probands-to-contact/'],
        },
      ];
    } else if (currentRole === 'EinwilligungsManager') {
      pages = [
        { name: 'SIDENAV.HOME', path: ['home'], subpaths: ['home'] },
        {
          name: 'SIDENAV.COMPLIANCE',
          path: ['compliance/view'],
          subpaths: ['compliance/'],
        },
      ];
    } else if (currentRole === 'Proband') {
      pages = [];
      pages.push({ name: 'SIDENAV.HOME', path: ['home'], subpaths: ['home'] });
      pages.push({
        name: 'SIDENAV.QUESTIONNAIRES',
        path: ['questionnaires/user'],
        subpaths: ['questionnaires/', 'questionnaire/'],
      });
      if (
        await this.complianceManager.userHasCompliances([
          ComplianceType.LABRESULTS,
        ])
      ) {
        pages.push({
          name: 'SIDENAV.LABORATORY_RESULTS',
          path: ['laboratory-results'],
          subpaths: ['laboratory-results'],
        });
      }
      if (await this.complianceManager.isInternalComplianceActive) {
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
