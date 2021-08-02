/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { PersonalDataService } from 'src/app/psa.app.core/providers/personaldata-service/personaldata-service';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { User } from '../../psa.app.core/models/user';
import {
  MAT_DATE_LOCALE,
  DateAdapter,
  MAT_DATE_FORMATS,
} from '@angular/material/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Studie } from '../../psa.app.core/models/studie';
import { AlertService } from '../../_services/alert.service';
import 'datejs';
import { OnInit } from '@angular/core';
import {
  AppDateAdapter,
  APP_DATE_FORMATS,
} from 'src/app/_helpers/date-adapter';
import { Observable } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MediaObserver } from '@angular/flex-layout';
import { DialogDeleteComponent } from '../../_helpers/dialog-delete';
import { MatDialog } from '@angular/material/dialog';
import { ProbandService } from '../../psa.app.core/providers/proband-service/proband.service';
import { DialogPopUpComponent } from '../../_helpers/dialog-pop-up';

@Component({
  templateUrl: 'probands-to-contact.component.html',
  styleUrls: ['./probands-to-contact.component.scss'],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'de' },
    {
      provide: DateAdapter,
      useClass: AppDateAdapter,
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: APP_DATE_FORMATS,
    },
  ],
})
export class ProbandsToContactComponent implements OnInit {
  studies: Studie[];
  currentRole: string;
  currentUser: User;
  dataSource: MatTableDataSource<any>;
  public cols: Observable<number>;
  probandIdToDelete: string;
  type: string;
  pendingComplianceChangeId: string;
  displayedColumns = [
    'username',
    'ids',
    'firstname',
    'lastname',
    'accountStatus',
    'questionnaire1',
    'notable',
    'questionnaire2',
    'notFilledout',
    'processed',
    'contact',
    'view',
  ];
  selection = new SelectionModel<string>(true, []);
  @ViewChild('filter') filter: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  currentStudy: string;
  isDataReady: boolean = false;
  filterKeyword: string;
  probands: any[];
  isLoading: boolean = true;
  tableData: any[];

  constructor(
    private questionnaireService: QuestionnaireService,
    private probandsService: ProbandService,
    private authService: AuthService,
    private matDialog: MatDialog,
    private alertService: AlertService,
    private translate: TranslateService,
    private router: Router,
    public dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private mediaObserver: MediaObserver,
    private cdr: ChangeDetectorRef,
    private personalDataService: PersonalDataService
  ) {
    this.questionnaireService.getStudies().then(
      (result: any) => {
        this.studies = result.studies;
      },
      (err: any) => {
        this.alertService.errorObject(err);
      }
    );

    const jwtHelper: JwtHelperService = new JwtHelperService();
    this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const tokenPayload = jwtHelper.decodeToken(this.currentUser.token);
    this.currentRole = tokenPayload.role;

    const gridAns = new Map([
      ['xs', 1],
      ['sm', 2],
      ['md', 4],
      ['lg', 5],
      ['xl', 6],
    ]);
    let startCond2: number;
    gridAns.forEach((cols, mqAlias) => {
      if (this.mediaObserver.isActive(mqAlias)) {
        startCond2 = cols;
      }
    });
    this.cols = this.mediaObserver.media$
      .map((change) => gridAns.get(change.mqAlias))
      .startWith(startCond2);
    this.probandIdToDelete =
      this.activatedRoute.snapshot.queryParamMap.get('probandIdToDelete');
    this.type = this.activatedRoute.snapshot.queryParamMap.get('type');
    this.pendingComplianceChangeId =
      this.activatedRoute.snapshot.queryParamMap.get(
        'pendingComplianceChangeId'
      );
  }

  ngOnInit(): void {
    this.initTable();
  }

  async initTable(): Promise<void> {
    const data = [];
    this.tableData = [];
    try {
      const probandsPersonalData =
        await this.personalDataService.getPersonalDataAll();
      const probandsToContact =
        await this.probandsService.getProbandsToContact();
      this.probands = probandsToContact['probands'];
      for (const probandToContact of this.probands) {
        const personalDataForPseudonym = probandsPersonalData.find(
          (res) => res.pseudonym === probandToContact.user_id
        );
        let accountStatus = '';
        const firstname = personalDataForPseudonym
          ? personalDataForPseudonym.vorname
          : '';
        const lastname = personalDataForPseudonym
          ? personalDataForPseudonym.name
          : '';
        if (
          probandToContact.account_status === 'active' &&
          probandToContact.study_status === 'active'
        ) {
          accountStatus = 'PROBANDEN.STATUS_ACTIV';
        } else if (probandToContact.study_status === 'deletion_pending') {
          accountStatus = 'PROBANDEN.STATUS_DELETION_PENDING';
        } else if (probandToContact.study_status === 'deleted') {
          accountStatus = 'PROBANDEN.STATUS_DELETED';
        } else if (probandToContact.account_status === 'deactivation_pending') {
          accountStatus = 'PROBANDEN.STATUS_DEACTIVATION_PENDING';
        } else if (probandToContact.account_status === 'deactivated') {
          accountStatus = 'PROBANDEN.STATUS_DEACTIVATED';
        } else if (probandToContact.account_status === 'no_account') {
          accountStatus = 'PROBANDEN.STATUS_NO_ACCOUNT';
        }

        const objectToPush = {
          id: probandToContact.id,
          username:
            probandToContact.user_id === probandToContact.ids
              ? ''
              : probandToContact.user_id,
          ids: probandToContact.ids,
          firstname,
          lastname,
          accountStatus,
          notable_answer_questionnaire_instances:
            probandToContact.notable_answer_questionnaire_instances,
          notable:
            probandToContact.is_notable_answer !== null
              ? probandToContact.is_notable_answer
              : undefined,
          notable_timestamp:
            probandToContact.is_notable_answer_at !== null
              ? new Date(probandToContact.is_notable_answer_at).getTime()
              : null,
          not_filledout_questionnaire_instances:
            probandToContact.not_filledout_questionnaire_instances,
          notFilledout:
            probandToContact.is_not_filledout !== null
              ? probandToContact.is_not_filledout
              : undefined,
          notFilledout_timestamp:
            probandToContact.is_not_filledout_at !== null
              ? new Date(probandToContact.is_not_filledout_at).getTime()
              : null,
          processed: probandToContact.processed,
        };
        data.push(objectToPush);
      }
    } catch (e) {
      console.log(e);
    }

    this.tableData = data;
    this.initDatasource(data);
  }

  initDatasource(data: any[]): void {
    this.dataSource = new MatTableDataSource(data);
    this.isLoading = false;
    this.isDataReady = true;
    this.cdr.detectChanges();

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.filterKeyword = '';
  }

  filterByNotableAnswer(): void {
    this.dataSource.filterPredicate = (data, filter): boolean => {
      return (
        String(data.notable).includes(filter) &&
        String(data.processed).includes('false')
      );
    };
    this.dataSource.filter = 'true';
  }

  filterByNotFilledout(): void {
    this.dataSource.filterPredicate = (data, filter): boolean => {
      return (
        String(data.notFilledout).includes(filter) &&
        String(data.processed).includes('false')
      );
    };
    this.dataSource.filter = 'true';
  }

  resetFilter(): void {
    this.dataSource.filter = '';
    this.filterKeyword = '';
  }

  contactProband(usernames: string[]): void {
    this.router.navigate(['/contact-proband/', usernames.join(';')]);
  }

  viewContactInfo(username): void {
    this.router.navigate(['/probands-personal-info/', username]);
  }

  openDialog(username: string, type: string): void {
    this.type = type;
    const data =
      this.type === 'personal'
        ? { data: 'die Kontaktdaten vom Probanden ' + username }
        : {
            data: 'alle Forschungs- und Kontaktdaten vom Probanden ' + username,
          };
    const dialogRef = this.dialog.open(DialogDeleteComponent, {
      width: '500px',
      data,
    });
  }

  setProcessed(id, processed): void {
    this.probandsService
      .putProbandToContact(id, { processed })
      .then((result) => {
        this.setDataElement(id, { processed });
        this.showResultDialog(
          this.translate.instant(
            'PROBANDS_TO_CONTACT.PROCESSED_STATUS_CHANGED'
          ),
          true
        );
      })
      .catch((error) => {
        console.log(error);
        return null;
      });
  }

  setDataElement(id, data): void {
    const THIS = this;
    this.dataSource.data.forEach((part, index, theArray) => {
      if (THIS.dataSource.data[index].id === id) {
        THIS.dataSource.data[index].processed = data.processed;
        return;
      }
    });
  }

  showResultDialog(info: string, success: boolean): void {
    this.matDialog.open(DialogPopUpComponent, {
      width: '400px',
      data: { content: info, isSuccess: success },
    });
  }
}
