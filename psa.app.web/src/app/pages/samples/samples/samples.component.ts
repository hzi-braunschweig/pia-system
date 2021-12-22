/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  Pipe,
  PipeTransform,
  ViewChild,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '../../../psa.app.core/models/user';
import { SampleTrackingService } from '../../../psa.app.core/providers/sample-tracking-service/sample-tracking.service';
import { DialogYesNoComponent } from '../../../_helpers/dialog-yes-no';
import { DialogInfoComponent } from '../../../_helpers/dialog-info';
import {
  DialogPopUpComponent,
  DialogPopUpData,
} from '../../../_helpers/dialog-pop-up';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { formatDate, Location } from '@angular/common';
import {
  DeletionType,
  DialogDeletePartnerComponent,
  DialogDeletePartnerData,
  DialogDeletePartnerResult,
} from '../../../_helpers/dialog-delete-partner';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AlertService } from '../../../_services/alert.service';
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';
import { MatPaginatorIntlGerman } from '../../../_helpers/mat-paginator-intl';
import { Study } from 'src/app/psa.app.core/models/study';
import { HttpErrorResponse } from '@angular/common/http';
import { BloodSample, LabResult } from '../../../psa.app.core/models/labresult';
import { Proband } from '../../../psa.app.core/models/proband';
import { PendingSampleDeletion } from '../../../psa.app.core/models/pendingDeletion';
import { AuthenticationManager } from '../../../_services/authentication-manager.service';

interface BloodSampleRow extends BloodSample {
  blood_sample_carried_out_value: string;
}

interface LabResultRow extends LabResult {
  pendingDeletionObject: PendingSampleDeletion;
}

@Component({
  selector: 'app-samples',
  templateUrl: './samples.component.html',
  styleUrls: ['./samples.component.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: MatPaginatorIntlGerman,
    },
  ],
})
export class SamplesComponent implements OnInit {
  pseudonym: string;
  currentRole: string;
  currentUser: User;
  dataSourceBluteproben: MatTableDataSource<BloodSampleRow>;
  dataSourceNasenabstrichten: MatTableDataSource<LabResultRow>;
  loading = true;
  statuses = [
    { value: true, viewValue: 'SAMPLES.BLOOD_SAMPLE_CARRIED_OUT' },
    { value: false, viewValue: 'SAMPLES.BLOOD_SAMPLE_NOT_CARRIED_OUT' },
  ];

  availableStudies: Study[] = [];

  showBlutProbenTable: boolean = false;
  showProbenTable: boolean = false;
  pendingDeletionId: string;
  disableScanSampleButton: boolean;
  @ViewChild('title1', { static: true }) title1: ElementRef;
  @ViewChild('title2', { static: true }) title2: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private alertService: AlertService,
    public dialog: MatDialog,
    private userService: AuthService,
    private sampleTrackingService: SampleTrackingService,
    private _location: Location,
    private questionnaireService: QuestionnaireService,
    auth: AuthenticationManager
  ) {
    this.currentRole = auth.getCurrentRole();

    this.pendingDeletionId =
      this.route.snapshot.queryParamMap.get('pendingDeletionId');
    this.disableScanSampleButton = JSON.parse(
      this.route.snapshot.queryParamMap.get('deactivated')
    );
    if (this.pendingDeletionId) {
      this.authService
        .getPendingDeletion(parseInt(this.pendingDeletionId, 10))
        .then(
          (result) => {
            if (result.requested_for && result.for_id) {
              this.openDialogDeletePartner(
                result.for_id,
                'study',
                result.requested_by,
                result.id
              );
            }
          },
          (err: HttpErrorResponse) => {
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
          }
        );
    }
  }

  displayedColumnsPM = [
    'proben_id',
    'dummy_proben_id',
    'scanned_by_participant',
    'labresults_available',
    'forwarding_completed',
    'study_status',
    'remark',
    'action',
    'deactivate',
  ];
  displayedColumnsUT = [
    'proben_id',
    'dummy_proben_id',
    'scanned_by_participant',
    'labresults_available',
    'remark',
    'study_status',
  ];
  displayedColumnsForscher = [
    'proben_id',
    'dummy_proben_id',
    'scanned_by_participant',
    'labresults_available',
    'study_status',
  ];

  displayedBlutprobenColumnsPM = [
    'proben_id',
    'blood_sample_carried_out',
    'remark',
  ];
  displayedBlutprobenColumnsUT = [
    'proben_id',
    'blood_sample_carried_out',
    'remark',
  ];
  displayedBlutprobenColumnsForscher = [
    'proben_id',
    'blood_sample_carried_out',
  ];

  proband: Proband;

  @ViewChild('filterBluteproben') filterBluteproben: ElementRef;
  @ViewChild('filterNasenabstrichen') filterNasenabstrichen: ElementRef;
  @ViewChild('paginator1') paginator1: MatPaginator;
  @ViewChild('paginator2') paginator2: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  ngOnInit(): void {
    this.pseudonym = this.route.snapshot.paramMap.get('pseudonym');
    if (
      this.currentRole === 'Untersuchungsteam' ||
      this.currentRole === 'ProbandenManager' ||
      this.currentRole === 'Forscher'
    ) {
      this.userService
        .getProband(this.pseudonym)
        .then(async (res) => {
          this.proband = res;
          if (this.proband.complianceBloodsamples) {
            this.showBlutProbenTable = true;
            this.initBlutProbenTable();
          }
          if (this.proband.complianceSamples) {
            this.showProbenTable = true;
            this.initProbenTable();
          }
          if (!this.showProbenTable && !this.showBlutProbenTable) {
            this.loading = false;
          }
          this.availableStudies = [
            await this.questionnaireService.getStudy(res.study),
          ];
        })
        .catch((e) => {
          console.log(e);
          this.loading = false;
        });
    } else {
      this.showBlutProbenTable = true;
      this.showProbenTable = true;
      this.initProbenTable();
      this.initBlutProbenTable();
    }
  }

  private async initProbenTable(): Promise<void> {
    this.loading = true;
    try {
      const tableData =
        (await this.sampleTrackingService.getAllLabResultsForUser(
          this.pseudonym
        )) as LabResultRow[];
      await Promise.all(
        tableData.map(async (labResult) => {
          if (labResult.study_status === 'active') {
            labResult.study_status = 'STUDIES.STATUS_ACTIVE';
          } else if (labResult.study_status === 'deletion_pending') {
            labResult.study_status = 'STUDIES.STATUS_DELETION_PENDING';

            // add pendingDeletion object if sample has a deletion pending
            let pendingDeletionObject: PendingSampleDeletion = null;
            try {
              pendingDeletionObject =
                await this.authService.getPendingDeletionForSampleId(
                  labResult.id
                );
            } catch (e) {
              console.error(e);
            }
            if (
              pendingDeletionObject &&
              pendingDeletionObject.requested_for === this.currentUser.username
            ) {
              (labResult as LabResultRow).pendingDeletionObject =
                pendingDeletionObject;
            }
          } else if (labResult.study_status === 'deleted') {
            labResult.study_status = 'STUDIES.STATUS_DELETED';
          }
          labResult.user_id = '';
        })
      );
      this.dataSourceNasenabstrichten = new MatTableDataSource(tableData);
      this.dataSourceNasenabstrichten.paginator = this.paginator1;
    } catch (err) {
      this.alertService.errorObject(err);
    }
    this.loading = false;
  }

  private async initBlutProbenTable(): Promise<void> {
    this.loading = true;
    try {
      const tableData =
        (await this.sampleTrackingService.getAllBloodSamplesForUser(
          this.pseudonym
        )) as BloodSampleRow[];
      tableData.forEach((bloodResult, bloodResultIndex) => {
        switch (bloodResult.blood_sample_carried_out) {
          case true:
            bloodResult.blood_sample_carried_out_value =
              'SAMPLES.BLOOD_SAMPLE_CARRIED_OUT';
            break;
          case false:
            bloodResult.blood_sample_carried_out_value =
              'SAMPLES.BLOOD_SAMPLE_NOT_CARRIED_OUT';
            break;
          default:
            bloodResult.blood_sample_carried_out_value =
              'SAMPLES.BLOOD_SAMPLE_NOT_YET_DETERMINED';
            break;
        }
        bloodResult.user_id = '';
      });
      this.dataSourceBluteproben = new MatTableDataSource(tableData);
      this.dataSourceBluteproben.paginator = this.paginator2;
    } catch (err) {
      this.alertService.errorObject(err);
    }
    this.loading = false;
  }

  applyFilterBluteproben(filterValue: string): void {
    this.dataSourceBluteproben.filter = filterValue.trim().toLowerCase();
  }

  applyFilterNasenabstrichten(filterValue: string): void {
    this.dataSourceNasenabstrichten.filter = filterValue.trim().toLowerCase();
  }

  onScanButtonClicked(isBloodSample: boolean): void {
    const dialogRef = this.dialog.open(ScanDialogComponent, {
      width: '350px',
      disableClose: true,
      data: {
        scan_input: '',
        isBloodSample,
        availableStudies: this.availableStudies,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== false) {
        if (!isBloodSample) {
          // set new_samples_sent explicitely to null for UT and to false for PM
          result.new_samples_sent = false;
          if (this.currentRole === 'Untersuchungsteam') {
            result.new_samples_sent = null;
          }
          this.sampleTrackingService
            .postLabResult(this.pseudonym, result)
            .then((res) => {
              this.showRequestWasSuccessDialog();
              this.initProbenTable();
            })
            .catch((err) => {
              if (err.status === 409) {
                this.showFail('SAMPLES.PROBEN_ID_ALREADY_EXISTS');
              } else {
                console.log(err);
                this.showFail('SAMPLES.COULD_NOT_SCAN');
              }
            });
        } else {
          this.sampleTrackingService
            .postBloodSample(this.pseudonym, result)
            .then((res) => {
              this.showRequestWasSuccessDialog();
              this.initBlutProbenTable();
            })
            .catch((err) => {
              if (err.status === 409) {
                this.showFail('SAMPLES.PROBEN_ID_ALREADY_EXISTS');
              } else {
                console.log(err);
                this.showFail('SAMPLES.COULD_NOT_SCAN');
              }
            });
        }
      }
    });
  }

  showFail(msg): void {
    this.dialog.open(DialogPopUpComponent, {
      width: '500px',
      data: {
        data: '',
        content: msg,
        isSuccess: false,
      },
    });
  }

  private showRequestWasSuccessDialog(): void {
    this.dialog.open(DialogPopUpComponent, {
      width: '500px',
      data: {
        data: '',
        content: 'QUESTION_PROBAND.SCANNING_SUCCESS',
        isSuccess: true,
      },
    });
  }

  onBackButtonClicked(): void {
    this._location.back();
  }

  onEditCellClicked(rowContent): void {
    const dialogRef = this.dialog.open(RemarkDialogComponent, {
      width: '250px',
      data: { remark: rowContent.remark },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== false) {
        const newData = {
          remark: result,
          new_samples_sent: rowContent.new_samples_sent,
          date_of_sampling: rowContent.date_of_sampling,
        };
        if (result === false) {
          newData.remark = ' ';
        }
        this.updateRemarkEntryInDatabase(newData, rowContent);
      }
    });
  }

  onEditSampleClicked(rowContent, isChangeStatus, status): void {
    if (isChangeStatus) {
      const oldValue = rowContent.blood_sample_carried_out;
      this.sampleTrackingService
        .putBloodSample(this.pseudonym, rowContent.sample_id, {
          blood_sample_carried_out: status,
        })
        .then((res) => {
          rowContent.remark = res['remark'];
          rowContent.blood_sample_carried_out = res['blood_sample_carried_out'];
        })
        .catch((err) => {
          if (err.status === 409) {
            this.initBlutProbenTable();
            this.showFail('SAMPLES.PROBEN_ID_ALREADY_EXISTS');
          } else {
            console.log(err);
            this.showFail('SAMPLES.COULD_NOT_SCAN');
          }
        });
    } else {
      const dialogRef = this.dialog.open(RemarkDialogComponent, {
        width: '250px',
        data: {
          remark: rowContent.remark,
          blood_sample_carried_out: rowContent.status,
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result !== false) {
          const newData = {
            remark: result,
            blood_sample_carried_out: rowContent.status,
          };
          if (result === false) {
            newData.remark = ' ';
            newData.blood_sample_carried_out = null;
          }
          this.sampleTrackingService
            .putBloodSample(this.pseudonym, rowContent.sample_id, newData)
            .then((res) => {
              rowContent.remark = res['remark'];
              rowContent.status = res['blood_sample_carried_out'];
            });
        }
      });
    }
  }

  onSamplesSentCheckBoxChecked(row): void {
    const newData = {
      remark: row.remark,
      new_samples_sent: row.new_samples_sent,
      date_of_sampling: row.date_of_sampling,
    };
    this.updateRemarkEntryInDatabase(newData, row);
  }

  updateRemarkEntryInDatabase(newData, rowContent): void {
    const resultID = rowContent.id;

    if (newData.date_of_sampling == null) {
      newData.date_of_sampling = undefined;
    }

    if (newData.remark == null) {
      newData.remark = ' ';
    }

    this.sampleTrackingService
      .putLabResult(this.pseudonym, resultID, newData)
      .then((res) => {
        rowContent.remark = res.remark;
        rowContent.new_samples_sent = res.new_samples_sent;
        rowContent.date_of_sampling = res.date_of_sampling;
      });
  }

  onDeactivateRow(userID, row): void {
    const sampleID = row.id;

    if (row.status === 'inactive') {
      this.sampleTrackingService
        .putLabResult(userID, sampleID, { status: 'new' })
        .then(() => {
          this.initProbenTable();
        });
    } else if (row.status === 'analyzed') {
      this.dialog.open(DialogInfoComponent, {
        width: '300px',
        data: { content: 'SAMPLES.DIALOG.CANNOT_DEACTIVATE' },
      });
      this.initProbenTable();
    } else {
      this.openDialog(userID, sampleID);
    }
  }

  openDialog(userID, sampleID): void {
    const dialogRef = this.dialog.open(DialogYesNoComponent, {
      width: '300px',
      data: { content: 'SAMPLES.DIALOG.SURE_DEACTIVATE' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'yes') {
        this.sampleTrackingService
          .putLabResult(userID, sampleID, { status: 'inactive' })
          .then(() => {
            this.initProbenTable();
          })
          .catch((err) => {
            console.log(err);
          });
      }
    });
  }

  openDeleteSampleDialog(sampleId: string, type: DeletionType): void {
    const dialogRef = this.dialog.open(DialogYesNoComponent, {
      width: '250px',
      data: { content: 'SAMPLES.DIALOG.SURE_DELETE' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'yes') {
        this.openDialogDeletePartner(sampleId, type);
      }
    });
  }

  openDialogDeletePartner(
    sampleId: string,
    type: DeletionType,
    usernamePM?: string,
    pendingdeletionId?: number
  ): void {
    const dialogData: DialogDeletePartnerData = {
      usernames: {
        sampleId,
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

    dialogRef.afterClosed().subscribe((result: DialogDeletePartnerResult) => {
      if (result) {
        let data: DialogPopUpData;
        if (result.success) {
          this.initProbenTable();
          switch (result.action) {
            case 'confirmed':
              data = {
                content: 'DIALOG.SUCCESS_DELETED_SAMPLE',
                values: { for_id: result.deletedId },
                isSuccess: true,
              };
              break;
            case 'rejected':
              data = {
                content: 'DIALOG.DELECTION_REJECTED_SAMPLE',
                values: { for_id: result.deletedId },
                isSuccess: true,
              };
              break;
            case 'requested':
              data = {
                content: 'DIALOG.SUCCESS_REQUESTED_SAMPLE',
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
          this.showResultDialog(data);
          this.router.navigate(['/sample-management/', this.pseudonym]);
        }
      }
    });
  }

  showResultDialog(data: DialogPopUpData): void {
    this.dialog.open(DialogPopUpComponent, {
      width: '300px',
      data,
    });
  }

  printTables(): void {
    const rowsNasenabstricht = [];
    const rowsBluteprobe = [];
    const pdfsize = 'a4';
    const doc = new jsPDF('p', 'pt', pdfsize);
    const fileName =
      'Proben_' +
      formatDate(new Date(), 'dd-MM-yyyy hh:mm:ss', 'en-US') +
      '.pdf';
    const columnsNasenabstricht = [
      { title: 'Viren-Probe ID', dataKey: 'id' },
      { title: 'Bakt-Probe ID', dataKey: 'dummy_sample_id' },
    ];
    const columnsBluteproben = [{ title: 'Proben-ID', dataKey: 'sample_id' }];

    this.dataSourceNasenabstrichten.filteredData.forEach((Nasenabstricht) => {
      const temp = {
        id: Nasenabstricht.id,
        dummy_sample_id: Nasenabstricht.dummy_sample_id
          ? Nasenabstricht.dummy_sample_id
          : '',
      };
      rowsNasenabstricht.push(temp);
    });
    this.dataSourceBluteproben.filteredData.forEach((Bluteprobe) => {
      const temp = { sample_id: Bluteprobe.sample_id };
      rowsBluteprobe.push(temp);
    });

    doc.text(this.title1.nativeElement.innerHTML, 14, 30);
    doc.autoTable(columnsNasenabstricht, rowsNasenabstricht, {
      startY: 40,
    });
    doc.text(
      this.title2.nativeElement.innerHTML,
      14,
      doc.autoTable.previous.finalY + 20
    );
    doc.autoTable(columnsBluteproben, rowsBluteprobe, {
      startY: doc.autoTable.previous.finalY + 30,
    });
    doc.save(fileName);
  }
}

@Component({
  selector: 'app-dialog-overview-example-dialog',
  template: `
    <h1 mat-dialog-title>{{ 'SAMPLES.REMARK_INPUT_DIALOG' | translate }}</h1>
    <div mat-dialog-content>
      <mat-form-field>
        <textarea
          matInput
          [(ngModel)]="data.remark"
          placeholder="{{ 'SAMPLES.REMARK' | translate }}"
          matTextareaAutosize
          matAutosizeMinRows="2"
          matAutosizeMaxRows="10"
        ></textarea>
      </mat-form-field>
    </div>
    <div mat-dialog-actions>
      <button mat-button (click)="onNoClick()">
        <mat-icon>cancel</mat-icon>
      </button>
      <button mat-button [mat-dialog-close]="data.remark">
        <mat-icon>done</mat-icon>
      </button>
    </div>
  `,
})
export class RemarkDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<RemarkDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onNoClick(): void {
    const updateRemark = false;
    this.dialogRef.close(updateRemark);
  }
}

@Component({
  selector: 'app-scan-dialog',
  template: `
    <h1 mat-dialog-title>
      {{ 'SAMPLES.SCAN_DIALOG' + (isBloodSample ? '_BLOOD' : '') | translate }}
    </h1>
    <form
      class="form-container"
      [formGroup]="scanForm"
      (ngSubmit)="scanForm.valid && onSubmit()"
    >
      <mat-dialog-content>
        <mat-grid-list [cols]="1" rowHeight="50px">
          <mat-grid-tile [rowspan]="2">
            <mat-form-field>
              <mat-select
                formControlName="study_select"
                placeholder="{{ 'SAMPLES.STUDY_SELECT' | translate }}"
              >
                <mat-option
                  *ngFor="let study of availableStudies"
                  [value]="study"
                >
                  {{ study.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>
          </mat-grid-tile>

          <mat-grid-tile [rowspan]="2" *ngIf="selectedStudy != null">
            <mat-form-field>
              <input
                type="text"
                formControlName="sample_id"
                matInput
                placeholder="{{
                  (isBloodSample
                    ? 'SAMPLES.PROBEN_ID'
                    : 'SAMPLES.VIREN_PROBE_ID'
                  ) | translate
                }}"
              />
              <mat-error *ngIf="scanForm.get('sample_id').hasError('required')"
                >{{ 'QUESTIONNAIRE_FORSCHER.VALUE_REQUIRED' | translate }}
              </mat-error>
              <mat-error
                *ngIf="
                  !scanForm.get('sample_id').hasError('required') &&
                  scanForm.get('sample_id').hasError('sampleWrongFormat')
                "
              >
                {{
                  'SAMPLES.WRONG_SAMPLE_FORMAT'
                    | translate
                      : {
                          prefix: sample_prefix ? sample_prefix + '-' : 'XXX',
                          length: sample_suffix_length
                            ? sample_suffix_length
                            : '0-N'
                        }
                }}
              </mat-error>
            </mat-form-field>
          </mat-grid-tile>

          <mat-grid-tile
            [rowspan]="2"
            *ngIf="selectedStudy != null && hasDummySampleId"
          >
            <mat-form-field>
              <input
                type="text"
                formControlName="dummy_sample_id"
                matInput
                placeholder="{{ 'SAMPLES.BAKT_PROBE_ID' | translate }}"
              />
              <mat-error
                *ngIf="scanForm.get('dummy_sample_id').hasError('required')"
                >{{
                  'QUESTIONNAIRE_FORSCHER.VALUE_REQUIRED' | translate
                }}</mat-error
              >
              <mat-error
                *ngIf="
                  !scanForm.get('dummy_sample_id').hasError('required') &&
                  scanForm.get('dummy_sample_id').hasError('sampleWrongFormat')
                "
              >
                {{
                  'SAMPLES.WRONG_SAMPLE_FORMAT'
                    | translate
                      : {
                          prefix: sample_prefix ? sample_prefix + '-' : 'XXX',
                          length: sample_suffix_length
                            ? sample_suffix_length
                            : '0-N'
                        }
                }}
              </mat-error>
            </mat-form-field>
          </mat-grid-tile>
        </mat-grid-list>
      </mat-dialog-content>

      <mat-dialog-actions>
        <button mat-button (click)="onNoClick()">
          <mat-icon>cancel</mat-icon>
        </button>
        <button mat-button type="submit" [disabled]="!scanForm.valid">
          <mat-icon>done</mat-icon>
        </button>
      </mat-dialog-actions>
    </form>
  `,
})
export class ScanDialogComponent {
  public scanForm: FormGroup;

  hasDummySampleId = false;
  isBloodSample = false;
  availableStudies: Study[] = [];
  selectedStudy: Study = null;
  sample_prefix: string = null;
  sample_suffix_length: number = null;

  constructor(
    public dialogRef: MatDialogRef<RemarkDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isBloodSample = this.data.isBloodSample;
    this.availableStudies = this.data.availableStudies;

    this.scanForm = new FormGroup({
      study_select: new FormControl(this.availableStudies, Validators.required),
      sample_id: new FormControl('', [
        Validators.required,
        this.validateSampleID.bind(this),
      ]),
      dummy_sample_id: new FormControl('', [
        Validators.required,
        this.validateSampleID.bind(this),
      ]),
    });

    this.scanForm
      .get('study_select')
      .valueChanges.subscribe((value) => this.onStudyUpdate(value));
  }

  onStudyUpdate(study: Study): void {
    this.selectedStudy = study;
    this.scanForm.get('sample_id').setValue('');
    this.scanForm.get('dummy_sample_id').setValue('');
    this.hasDummySampleId =
      !this.isBloodSample && this.selectedStudy.has_rna_samples;

    if (!this.hasDummySampleId) {
      this.scanForm.get('dummy_sample_id').disable();
    } else {
      this.scanForm.get('dummy_sample_id').enable();
    }

    this.sample_prefix = this.selectedStudy.sample_prefix;
    this.sample_suffix_length = this.selectedStudy.sample_suffix_length;
  }

  onNoClick(): void {
    const sampleWasScanned = false;
    this.dialogRef.close(sampleWasScanned);
  }

  onSubmit(): void {
    const result: any = { sample_id: this.scanForm.get('sample_id').value };
    if (this.hasDummySampleId) {
      result.dummy_sample_id = this.scanForm.get('dummy_sample_id').value;
    }
    this.dialogRef.close(result);
  }

  validateSampleID(control: AbstractControl): { sampleWrongFormat: boolean } {
    const regexp = new RegExp(
      (this.sample_prefix ? '^' + this.sample_prefix + '-' : '.*') +
        (this.sample_suffix_length
          ? '[0-9]{' + this.sample_suffix_length + '}$'
          : '[0-9]*$'),
      'i'
    );
    if (!control.value || !regexp.test(control.value)) {
      return { sampleWrongFormat: true };
    } else {
      return null;
    }
  }
}

@Pipe({
  name: 'statusCheckout',
})
export class ImplementStatusPipe implements PipeTransform {
  transform(value: string, fallback: string): string {
    let res = 'SAMPLES.NO';
    if (value === 'analyzed') {
      res = 'SAMPLES.YES';
    }
    return res;
  }
}

@Pipe({
  name: 'statusCheckout2',
})
export class ImplementStatusPipe2 implements PipeTransform {
  transform(value: string, fallback: string): string {
    let res = 'SAMPLES.NO';
    if (value === 'sampled' || value === 'analyzed') {
      res = 'SAMPLES.YES';
    }
    return res;
  }
}
