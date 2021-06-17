import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  forwardRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { AlertService } from '../../../_services/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Studie } from '../../../psa.app.core/models/studie';
import { JwtHelperService } from '@auth0/angular-jwt';
import { User } from '../../../psa.app.core/models/user';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PersonalDataService } from 'src/app/psa.app.core/providers/personaldata-service/personaldata-service';
import { MediaObserver } from '@angular/flex-layout';
import { Observable } from 'rxjs';
import { DialogDeleteComponent } from '../../../_helpers/dialog-delete';
import {
  DeletionType,
  DialogDeletePartnerComponent,
  DialogDeletePartnerData,
  DialogDeletePartnerResult,
} from '../../../_helpers/dialog-delete-partner';
import {
  DialogPopUpComponent,
  DialogPopUpData,
} from '../../../_helpers/dialog-pop-up';
import { DialogChangeComplianceComponent } from '../../../_helpers/dialog-change-compliance';
import { MatPaginatorIntlGerman } from '../../../_helpers/mat-paginator-intl';
import { UserWithStudyAccess } from 'src/app/psa.app.core/models/user-with-study-access';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  templateUrl: 'probands-personal-info.component.html',
  styleUrls: ['probands-personal-info.component.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: forwardRef(() => MatPaginatorIntlGerman),
    },
  ],
})
export class ProbandsPersonalInfoComponent implements OnInit {
  studies: Studie[];
  currentRole: string;
  currentUser: User;
  dataSource: MatTableDataSource<any>;
  public cols: Observable<number>;
  probandIdToDelete: string;
  type: DeletionType;
  pendingComplianceChangeId: string;
  displayedColumns = [
    'username',
    'ids',
    'studyNamesArray',
    'vorname',
    'nachname',
    'view',
    'accountStatus',
    'view_answers',
    'delete',
  ];
  selection = new SelectionModel<string>(true, []);
  @ViewChild('filter') filter: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  currentStudy: string;
  isDataReady: boolean = false;
  filterKeyword: string;
  probands: UserWithStudyAccess[];
  isLoading: boolean = true;
  tableData: any[];

  constructor(
    private questionnaireService: QuestionnaireService,
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router,
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private mediaObserver: MediaObserver,
    private cdr: ChangeDetectorRef,
    private personalDataService: PersonalDataService
  ) {
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
    this.type = this.activatedRoute.snapshot.queryParamMap.get(
      'type'
    ) as DeletionType;
    this.pendingComplianceChangeId =
      this.activatedRoute.snapshot.queryParamMap.get(
        'pendingComplianceChangeId'
      );

    if (this.probandIdToDelete) {
      switch (this.type) {
        case 'personal':
          this.personalDataService
            .getPendingDeletionForProbandId(this.probandIdToDelete)
            .then((result: any) => {
              if (result.requested_for && result.proband_id) {
                this.openDialogDeletePartner(
                  result.proband_id,
                  this.type,
                  result.requested_by,
                  result.id
                );
              }
            })
            .catch((err: HttpErrorResponse) => {
              if (
                err.error.message ===
                'The requester is not allowed to get this pending deletion'
              ) {
                this.showResultDialog({
                  content: 'PROBANDEN.PENDING_DELETE_ERROR',
                  isSuccess: false,
                });
              } else if (
                err.error.message === 'The pending deletion was not found'
              ) {
                this.showResultDialog({
                  content: 'PROBANDEN.PENDING_DELETION_NOT_FOUND',
                  isSuccess: false,
                });
              } else if (
                err.error.message ===
                'Could not get the pending deletion: Unknown or wrong role'
              ) {
                this.showResultDialog({
                  content: 'PROBANDEN.PENDING_DELETION_WRONG_ROLE',
                  isSuccess: false,
                });
              } else {
                this.alertService.errorObject(err);
              }
            });
          break;
        case 'general':
          this.authService
            .getPendingDeletionForProbandId(this.probandIdToDelete)
            .then((result: any) => {
              if (result.requested_for && result.for_id && result.type) {
                this.openDialogDeletePartner(
                  result.for_id,
                  this.type,
                  result.requested_by,
                  result.id
                );
              }
            })
            .catch((err: HttpErrorResponse) => {
              if (
                err.error.message ===
                'The requester is not allowed to get this pending deletion'
              ) {
                this.showResultDialog({
                  content: 'PROBANDEN.PENDING_DELETE_ERROR',
                  isSuccess: false,
                });
              } else if (
                err.error.message === 'The pending deletion was not found'
              ) {
                this.showResultDialog({
                  content: 'PROBANDEN.PENDING_DELETION_NOT_FOUND',
                  isSuccess: false,
                });
              } else if (
                err.error.message ===
                'Could not get the pending deletion: Unknown or wrong role'
              ) {
                this.showResultDialog({
                  content: 'PROBANDEN.PENDING_DELETION_WRONG_ROLE',
                  isSuccess: false,
                });
              } else {
                this.alertService.errorObject(err);
              }
            });
          break;
      }
    }
    if (this.pendingComplianceChangeId) {
      this.authService
        .getPendingComplianceChange(this.pendingComplianceChangeId)
        .then((result: any) => {
          if (result.requested_for && result.proband_id) {
            this.openDialogChangeCompliance(result.proband_id, result);
          }
        })
        .catch((err: HttpErrorResponse) => {
          if (
            err.error.message ===
            'The requester is not allowed to get this pending compliance change'
          ) {
            this.showResultDialog({
              content: 'PROBANDEN.PENDING_COMPLIANCE_ERROR',
              isSuccess: false,
            });
          } else if (
            err.error.message === 'The pending compliance change was not found'
          ) {
            this.showResultDialog({
              content: 'PROBANDEN.PENDING_COMPLIANCE_NOT_FOUND',
              isSuccess: false,
            });
          } else if (
            err.error.message ===
            'Could not get the pending compliance change: Unknown or wrong role'
          ) {
            this.showResultDialog({
              content: 'PROBANDEN.PENDING_COMPLIANCE_WRONG_ROLE',
              isSuccess: false,
            });
          } else {
            this.alertService.errorObject(err);
          }
        });
    }
  }

  ngOnInit(): void {
    this.initTable();
  }

  async getUsers(): Promise<void> {
    const probandenData = await this.authService.getUsers();
    this.probands = probandenData.users;
  }

  async initTable(): Promise<void> {
    const data = [];
    this.tableData = [];
    try {
      const probandenPersonalData =
        await this.personalDataService.getPersonalDataAll();
      const probandenData = await this.authService.getUsers();
      this.studies = (await this.questionnaireService.getStudies()).studies;
      this.probands = probandenData.users;

      for (const proband of this.probands) {
        const studyOfProband = this.getSuperStudyOfProband(proband);

        const personalDataForPseudonym = probandenPersonalData.find(
          (res) => res.pseudonym === proband.username
        );
        let studyNamesArray = '';
        let accountStatus = '';
        const vorname = personalDataForPseudonym
          ? personalDataForPseudonym.vorname
          : '';
        const name = personalDataForPseudonym
          ? personalDataForPseudonym.name
          : '';
        const pendingComplianceChange = proband.pendingComplianceChange
          ? true
          : false;
        for (const study_access of proband.study_accesses) {
          if (studyNamesArray) {
            studyNamesArray += ', ';
          }
          studyNamesArray += `${study_access.study_id} (${study_access.access_level})`;
        }
        if (
          proband.account_status === 'active' &&
          proband.study_status === 'active'
        ) {
          accountStatus = 'PROBANDEN.STATUS_ACTIV';
        } else if (proband.study_status === 'deletion_pending') {
          accountStatus = 'PROBANDEN.STATUS_DELETION_PENDING';
        } else if (proband.study_status === 'deleted') {
          accountStatus = 'PROBANDEN.STATUS_DELETED';
        } else if (proband.account_status === 'deactivation_pending') {
          accountStatus = 'PROBANDEN.STATUS_DEACTIVATION_PENDING';
        } else if (proband.account_status === 'deactivated') {
          accountStatus = 'PROBANDEN.STATUS_DEACTIVATED';
        } else if (proband.account_status === 'no_account') {
          accountStatus = 'PROBANDEN.STATUS_NO_ACCOUNT';
        }

        const pendingComplianceChangeObject =
          await this.getPendingComplianceChangeObjectForProband(proband);
        const pendingDeletionObject =
          await this.getPendingDeletionObjectForProband(proband);

        const objectToPush = {
          username: proband.username === proband.ids ? '' : proband.username,
          ids: proband.ids,
          vorname,
          nachname: name,
          studyNamesArray,
          accountStatus,
          pendingComplianceChange,
          pendingComplianceChangeObject,
          pendingDeletionPersonalObject:
            proband.account_status === 'deactivation_pending'
              ? pendingDeletionObject
              : null,
          pendingDeletionGeneralObject:
            proband.study_status === 'deletion_pending'
              ? pendingDeletionObject
              : null,
          has_partial_opposition: studyOfProband.has_partial_opposition,
          has_total_opposition: studyOfProband.has_total_opposition,
          has_compliance_opposition: studyOfProband.has_compliance_opposition,
          has_four_eyes_opposition: studyOfProband.has_four_eyes_opposition,
        };

        data.push(objectToPush);
      }
    } catch (e) {
      console.log(e);
    }

    this.tableData = data;
    this.initDatasource([]);
  }

  getSuperStudyOfProband(proband): Studie {
    return this.studies.find(
      (study) => study.name === proband.study_accesses[0].study_id
    );
  }

  async getPendingComplianceChangeObjectForProband(proband: any): Promise<any> {
    try {
      const pendingComplianceChangeObject: any = proband.pendingComplianceChange
        ? await this.authService.getPendingComplianceChangeForProband(
            proband.username
          )
        : null;
      if (
        pendingComplianceChangeObject &&
        pendingComplianceChangeObject.requested_for ===
          this.currentUser.username
      ) {
        return pendingComplianceChangeObject;
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
  }

  async getPendingDeletionObjectForProband(proband: any): Promise<any> {
    try {
      const pendingDeletionObject: any =
        proband.study_status === 'deletion_pending'
          ? await this.authService.getPendingDeletionForProbandId(
              proband.username
            )
          : proband.account_status === 'deactivation_pending'
          ? await this.personalDataService.getPendingDeletionForProbandId(
              proband.username
            )
          : null;
      if (
        pendingDeletionObject &&
        pendingDeletionObject.requested_for === this.currentUser.username
      ) {
        return pendingDeletionObject;
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
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

  filterSelectMethod(): void {
    if (!this.dataSource) {
      return;
    }
    if (this.tableData.length > 0) {
      this.dataSource.data = this.tableData;
    }
    this.dataSource.filter = this.currentStudy;
  }

  applyFilter(): void {
    this.dataSource.filter = this.filterKeyword.trim().toLowerCase();
  }

  resetFilter(): void {
    this.dataSource.data = [];
    this.dataSource.filter = '';
    this.currentStudy = undefined;
    this.filterKeyword = '';
  }

  editPersonalData(username: any): void {
    this.router.navigate(['/probands-personal-info/', username]);
  }

  openDialog(probandRow: any, type: DeletionType): void {
    const username = probandRow.username ? probandRow.username : probandRow.ids;
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

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        if (probandRow.has_four_eyes_opposition) {
          this.openDialogDeletePartner(username, type);
        } else {
          this.doDeletion(this.type, username);
        }
      }
    });
  }

  private async doDeletion(
    type: DeletionType,
    username: string
  ): Promise<void> {
    this.isLoading = true;

    let data: DialogPopUpData;
    try {
      switch (type) {
        case 'personal':
          await this.personalDataService.postPendingDeletion({
            requested_for: this.currentUser.username,
            proband_id: username,
          });
          data = {
            content: 'DIALOG.SUCCESS_DELETED_PROBAND',
            values: { for_id: username },
            isSuccess: true,
          };
          break;
        case 'general':
          await this.authService.postPendingDeletion({
            requested_for: this.currentUser.username,
            type: 'proband',
            for_id: username,
          });
          data = {
            content: 'DIALOG.SUCCESS_DELETED_PROBAND',
            values: { for_id: username },
            isSuccess: true,
          };
          break;
      }
      this.initTable().then(() => this.filterSelectMethod());
    } catch (err) {
      data = {
        content: 'DIALOG.ERROR_DELETE',
        isSuccess: false,
      };
    }
    this.showResultDialog(data);
    this.isLoading = false;
  }

  openDialogDeletePartner(
    usernameProband: string,
    type: DeletionType,
    usernamePM?: string,
    pendingdeletionId?: string
  ): void {
    const dialogData: DialogDeletePartnerData = {
      usernames: {
        usernameProband,
        usernamePM: usernamePM ? usernamePM : null,
      },
      type,
      pendingdeletionId,
    };
    const dialogRef: MatDialogRef<
      DialogDeletePartnerComponent,
      DialogDeletePartnerResult
    > = this.dialog.open<
      DialogDeletePartnerComponent,
      DialogDeletePartnerData,
      DialogDeletePartnerResult
    >(DialogDeletePartnerComponent, {
      width: '400px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let data: DialogPopUpData;
        if (result.success) {
          this.initTable().then(() => this.filterSelectMethod());
          switch (result.action) {
            case 'confirmed':
              data = {
                content: 'DIALOG.SUCCESS_DELETED_PROBAND',
                values: { for_id: result.deletedId },
                isSuccess: true,
              };
              break;
            case 'rejected':
              data = {
                content: 'DIALOG.DELECTION_REJECTED_PROBAND',
                values: { for_id: result.deletedId },
                isSuccess: true,
              };
              break;
            case 'requested':
              data = {
                content: 'DIALOG.SUCCESS_REQUESTED_PROBAND',
                values: {
                  for_id: result.deletedId,
                  requested_for: result.requestedFor,
                },
                isSuccess: true,
              };
              break;
          }
        } else {
          switch (result.action) {
            case 'confirmed':
              data = {
                content: 'DIALOG.ERROR_DELETE_CONFIRMATION',
                isSuccess: false,
              };
              break;
            case 'rejected':
              data = {
                content: 'DIALOG.ERROR_DELETE_REJECT',
                isSuccess: false,
              };
              break;
            case 'requested':
              data = {
                content: 'DIALOG.ERROR_DELETE_REQUEST',
                isSuccess: false,
              };
              break;
          }
        }
        this.showResultDialog(data);
      }
      this.router.navigate(['/probands-personal-info/']);
    });
  }

  async openDialogChangeCompliance(
    usernameProband: string,
    response?: any
  ): Promise<void> {
    await this.getUsers();
    let compliance_labresults;
    let compliance_samples;
    let compliance_bloodsamples;
    let has_four_eyes_opposition;

    if (response) {
      compliance_labresults = response.compliance_labresults_to;
      compliance_samples = response.compliance_samples_to;
      compliance_bloodsamples = response.compliance_bloodsamples_to;
      has_four_eyes_opposition = true;
    } else {
      for (const proband of this.probands) {
        if (usernameProband === proband.username) {
          compliance_labresults = proband.compliance_labresults;
          compliance_samples = proband.compliance_samples;
          compliance_bloodsamples = proband.compliance_bloodsamples;
          has_four_eyes_opposition =
            this.getSuperStudyOfProband(proband).has_four_eyes_opposition;
          break;
        }
      }
    }

    const dialogRef = this.dialog.open(DialogChangeComplianceComponent, {
      width: '400px',
      data: {
        has_four_eyes_opposition,
        usernameProband,
        compliance_labresults,
        compliance_samples,
        compliance_bloodsamples,
        requested_by: response ? response.requested_by : null,
        requested_for: this.currentUser.username,
        deletePendingComplianceChangeId: response ? response.id : null,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        if (result[1] && result[1].proband_id) {
          await this.initTable();
          this.filterSelectMethod();
          result[1].for_id = result[1].for_id
            ? result[1].for_id
            : result[1].proband_id;
          let data;
          if (result[0].acceptDelete || !has_four_eyes_opposition) {
            data = result[0].changingRejected
              ? {
                  content: 'PROBANDEN.CHANGE_COMPLIANCES_REJECTED',
                  values: { probandUsername: result[1].proband_id },
                  isSuccess: false,
                }
              : {
                  content: 'PROBANDEN.PROBAND_COMPLIANCES_CHANGED',
                  values: { probandUsername: result[1].proband_id },
                  isSuccess: true,
                };
          } else {
            data = {
              content: 'PROBANDEN.CHANGE_COMPLIANCES_REQUESTED',
              isSuccess: true,
            };
          }
          this.showResultDialog(data);
        } else {
          let dataError;
          if (result[0] && result[0].acceptDelete) {
            dataError = {
              content: 'DIALOG.ERROR_COMPLIANCE_CONFIRMATION',
              isSuccess: false,
            };
          } else if (result[0] && !result[0].acceptDelete) {
            dataError = {
              content: 'DIALOG.ERROR_COMPLIANCE_REQUEST',
              isSuccess: false,
            };
          } else {
            dataError = {
              content: 'DIALOG.ERROR_COMPLIANCE',
              isSuccess: false,
            };
          }
          this.showResultDialog(dataError);
        }
      }
      this.router.navigate(['/probands-personal-info/']);
    });
  }

  viewQuestionnaireInstancesForUser(username: string): void {
    this.router.navigate(['/questionnaireInstances/', username]);
  }

  showResultDialog(data): void {
    this.dialog.open(DialogPopUpComponent, {
      width: '300px',
      data,
    });
  }
}
