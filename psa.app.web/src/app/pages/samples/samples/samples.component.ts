/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { SampleTrackingService } from '../../../psa.app.core/providers/sample-tracking-service/sample-tracking.service';
import { DialogYesNoComponent } from '../../../dialogs/dialog-yes-no/dialog-yes-no';
import { DialogInfoComponent } from '../../../_helpers/dialog-info';
import {
  DialogPopUpComponent,
  DialogPopUpData,
} from '../../../_helpers/dialog-pop-up';
import { formatDate, Location } from '@angular/common';
import {
  DeletionType,
  DialogDeletePartnerComponent,
  DialogDeletePartnerData,
  DialogDeletePartnerResult,
} from '../../../_helpers/dialog-delete-partner';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { UserService } from '../../../psa.app.core/providers/user-service/user.service';
import { AlertService } from '../../../_services/alert.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MatPaginatorIntlGerman } from '../../../_helpers/mat-paginator-intl';
import { BloodSample, LabResult } from '../../../psa.app.core/models/labresult';
import { Proband } from '../../../psa.app.core/models/proband';
import { PendingSampleDeletion } from '../../../psa.app.core/models/pendingDeletion';
import { CurrentUser } from '../../../_services/current-user.service';
import {
  ScanDialogComponent,
  ScanDialogData,
  ScanDialogResult,
} from '../sample-scan-dialog/scan-dialog.component';
import { RemarkDialogComponent } from '../sample-remark-dialog/remark-dialog.component';
import { filter } from 'rxjs/operators';

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
  public proband: Proband;

  public dataSourceBlutproben: MatTableDataSource<BloodSampleRow>;
  public dataSourceNasenabstriche: MatTableDataSource<LabResultRow>;

  public showBlutProbenTable: boolean = false;
  public showProbenTable: boolean = false;

  public loading = true;

  public disableScanSampleButton: boolean =
    this.route.snapshot.queryParamMap.get('deactivated') === 'true';

  @ViewChild('title1', { static: true }) private title1: ElementRef;
  @ViewChild('title2', { static: true }) private title2: ElementRef;

  @ViewChild('paginator1') private paginator1: MatPaginator;
  @ViewChild('paginator2') private paginator2: MatPaginator;

  public displayedColumnsPM = [
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

  public displayedColumnsUT = [
    'proben_id',
    'dummy_proben_id',
    'scanned_by_participant',
    'labresults_available',
    'remark',
    'study_status',
  ];

  public displayedColumnsForscher = [
    'proben_id',
    'dummy_proben_id',
    'scanned_by_participant',
    'labresults_available',
    'study_status',
  ];

  public displayedBlutprobenColumnsPM = [
    'proben_id',
    'blood_sample_carried_out',
    'remark',
  ];

  public displayedBlutprobenColumnsUT = [
    'proben_id',
    'blood_sample_carried_out',
    'remark',
  ];

  public displayedBlutprobenColumnsForscher = [
    'proben_id',
    'blood_sample_carried_out',
  ];

  constructor(
    public readonly user: CurrentUser,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService,
    private authService: AuthService,
    private sampleTrackingService: SampleTrackingService,
    private location: Location,
    private userService: UserService
  ) {}

  private static getTranslationStringForBloodSampleCarriedOut(
    value: boolean
  ): string {
    switch (value) {
      case true:
        return 'SAMPLES.BLOOD_SAMPLE_CARRIED_OUT';
      case false:
        return 'SAMPLES.BLOOD_SAMPLE_NOT_CARRIED_OUT';
      default:
        return 'SAMPLES.BLOOD_SAMPLE_NOT_YET_DETERMINED';
    }
  }

  public async ngOnInit(): Promise<void> {
    try {
      const pseudonym = this.route.snapshot.paramMap.get('pseudonym');
      this.proband = await this.authService.getProband(pseudonym);

      await this.initPendingDeletion();

      if (this.proband.complianceBloodsamples) {
        this.showBlutProbenTable = true;
        await this.initBlutProbenTable();
      }
      if (this.proband.complianceSamples) {
        this.showProbenTable = true;
        await this.initProbenTable();
      }
      if (!this.showProbenTable && !this.showBlutProbenTable) {
        this.loading = false;
      }
    } catch (err) {
      console.log(err);
      this.loading = false;
    }
  }

  private async initPendingDeletion(): Promise<void> {
    const pendingDeletionId = Number(
      this.route.snapshot.queryParamMap.get('pendingDeletionId')
    );

    if (!pendingDeletionId) {
      return;
    }

    try {
      const result = await this.authService.getPendingDeletion(
        pendingDeletionId
      );

      if (result.requested_for && result.for_id) {
        this.openDialogDeletePartner(
          result.for_id,
          'study',
          result.requested_by,
          result.id
        );
      }
    } catch (err) {
      if (
        err?.error?.message ===
        'The requester is not allowed to get this pending deletion'
      ) {
        this.showResultDialog({
          content: 'PROBANDEN.PENDING_DELETE_ERROR',
          isSuccess: false,
        });
      } else if (err?.error?.message === 'The pending deletion was not found') {
        this.showResultDialog({
          content: 'PROBANDEN.PENDING_DELETION_NOT_FOUND',
          isSuccess: false,
        });
      } else if (
        err?.error?.message ===
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
  }

  private async initProbenTable(): Promise<void> {
    this.loading = true;
    try {
      const tableData =
        (await this.sampleTrackingService.getAllLabResultsForUser(
          this.proband.pseudonym
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
              pendingDeletionObject.requested_for === this.user.username
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
      this.dataSourceNasenabstriche = new MatTableDataSource(tableData);
      this.dataSourceNasenabstriche.paginator = this.paginator1;
    } catch (err) {
      this.alertService.errorObject(err);
    }
    this.loading = false;
  }

  private async initBlutProbenTable(): Promise<void> {
    this.loading = true;
    try {
      const bloodSamples: BloodSample[] =
        await this.sampleTrackingService.getAllBloodSamplesForUser(
          this.proband.pseudonym
        );
      const tableData: BloodSampleRow[] = bloodSamples.map((bloodResult) => ({
        ...bloodResult,
        user_id: '',
        blood_sample_carried_out_value:
          SamplesComponent.getTranslationStringForBloodSampleCarriedOut(
            bloodResult.blood_sample_carried_out
          ),
      }));
      this.dataSourceBlutproben = new MatTableDataSource(tableData);
      this.dataSourceBlutproben.paginator = this.paginator2;
    } catch (err) {
      this.alertService.errorObject(err);
    }
    this.loading = false;
  }

  public applyFilterBlutproben(filterValue: string): void {
    this.dataSourceBlutproben.filter = filterValue.trim().toLowerCase();
  }

  public applyFilterNasenabstriche(filterValue: string): void {
    this.dataSourceNasenabstriche.filter = filterValue.trim().toLowerCase();
  }

  public async onScanButtonClicked(isBloodSample: boolean): Promise<void> {
    const study = await this.userService.getStudy(this.proband.study);
    this.dialog
      .open<ScanDialogComponent, ScanDialogData, ScanDialogResult>(
        ScanDialogComponent,
        {
          width: '350px',
          disableClose: true,
          data: {
            isBloodSample,
            study,
          },
        }
      )
      .afterClosed()
      .pipe(filter((result) => !!result))
      .subscribe(async (result) => {
        try {
          if (isBloodSample) {
            await this.sampleTrackingService.postBloodSample(
              this.proband.pseudonym,
              result
            );
            await this.initBlutProbenTable();
          } else {
            // set new_samples_sent explicitly to null for UT and to false for PM
            const labResult = {
              ...result,
              new_samples_sent: this.user.hasRole('Untersuchungsteam')
                ? null
                : false,
            };
            await this.sampleTrackingService.postLabResult(
              this.proband.pseudonym,
              labResult
            );
            await this.initProbenTable();
          }
          this.showRequestWasSuccessDialog();
        } catch (err) {
          if (err.status === 409) {
            this.showFail('SAMPLES.PROBEN_ID_ALREADY_EXISTS');
          } else {
            console.log(err);
            this.showFail('SAMPLES.COULD_NOT_SCAN');
          }
        }
      });
  }

  private showFail(msg): void {
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

  public onBackButtonClicked(): void {
    this.location.back();
  }

  public onEditCellClicked(rowContent): void {
    this.dialog
      .open(RemarkDialogComponent, {
        width: '350px',
        data: { remark: rowContent.remark },
      })
      .afterClosed()
      .subscribe(
        async (result) =>
          await this.updateRemarkEntryInDatabase(
            {
              remark: result || ' ',
              new_samples_sent: rowContent.new_samples_sent,
              date_of_sampling: rowContent.date_of_sampling,
            },
            rowContent
          )
      );
  }

  public async onEditSampleStatusClicked(
    rowContent: BloodSampleRow,
    newStatus: boolean
  ): Promise<void> {
    try {
      const res = await this.sampleTrackingService.putBloodSample(
        this.proband.pseudonym,
        rowContent.sample_id,
        { blood_sample_carried_out: newStatus }
      );
      rowContent.remark = res['remark'];
      rowContent.blood_sample_carried_out = res['blood_sample_carried_out'];
    } catch (err) {
      if (err.status === 409) {
        await this.initBlutProbenTable();
        this.showFail('SAMPLES.PROBEN_ID_ALREADY_EXISTS');
      } else {
        console.log(err);
        this.showFail('SAMPLES.COULD_NOT_SCAN');
      }
    }
  }

  public onEditSampleRemarkClicked(rowContent): void {
    this.dialog
      .open(RemarkDialogComponent, {
        width: '350px',
        data: { remark: rowContent.remark },
      })
      .afterClosed()
      .subscribe(async (result) => {
        const res = await this.sampleTrackingService.putBloodSample(
          this.proband.pseudonym,
          rowContent.sample_id,
          {
            remark: result || ' ',
            blood_sample_carried_out: result ? rowContent.status : null,
          }
        );
        rowContent.remark = res['remark'];
        rowContent.status = res['blood_sample_carried_out'];
      });
  }

  public async onSamplesSentCheckBoxChecked(row): Promise<void> {
    await this.updateRemarkEntryInDatabase(
      {
        remark: row.remark,
        new_samples_sent: row.new_samples_sent,
        date_of_sampling: row.date_of_sampling,
      },
      row
    );
  }

  private async updateRemarkEntryInDatabase(
    newData,
    rowContent
  ): Promise<void> {
    const resultID = rowContent.id;

    if (newData.date_of_sampling == null) {
      newData.date_of_sampling = undefined;
    }

    if (newData.remark == null) {
      newData.remark = ' ';
    }

    const res = await this.sampleTrackingService.putLabResult(
      this.proband.pseudonym,
      resultID,
      newData
    );
    rowContent.remark = res.remark;
    rowContent.new_samples_sent = res.new_samples_sent;
    rowContent.date_of_sampling = res.date_of_sampling;
  }

  public async onDeactivateRow(row: LabResultRow): Promise<void> {
    if (row.status === 'inactive') {
      await this.sampleTrackingService.putLabResult(
        this.proband.pseudonym,
        row.id,
        { status: 'new' }
      );
    } else if (row.status === 'analyzed') {
      this.dialog.open(DialogInfoComponent, {
        width: '300px',
        data: { content: 'SAMPLES.DIALOG.CANNOT_DEACTIVATE' },
      });
    } else {
      this.dialog
        .open(DialogYesNoComponent, {
          data: { content: 'SAMPLES.DIALOG.SURE_DEACTIVATE' },
        })
        .afterClosed()
        .pipe(filter((result) => result === 'yes'))
        .subscribe(() =>
          this.sampleTrackingService.putLabResult(
            this.proband.pseudonym,
            row.id,
            {
              status: 'inactive',
            }
          )
        );
    }
    await this.initProbenTable();
  }

  public openDeleteSampleDialog(sampleId: string, type: DeletionType): void {
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

  public openDialogDeletePartner(
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
      affectedStudy: this.proband.study,
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
          this.router.navigate(['/sample-management/', this.proband.pseudonym]);
        }
      }
    });
  }

  private showResultDialog(data: DialogPopUpData): void {
    this.dialog.open(DialogPopUpComponent, {
      width: '300px',
      data,
    });
  }

  public printTables(): void {
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

    this.dataSourceNasenabstriche.filteredData.forEach((Nasenabstricht) => {
      const temp = {
        id: Nasenabstricht.id,
        dummy_sample_id: Nasenabstricht.dummy_sample_id
          ? Nasenabstricht.dummy_sample_id
          : '',
      };
      rowsNasenabstricht.push(temp);
    });
    this.dataSourceBlutproben.filteredData.forEach((Bluteprobe) => {
      const temp = { sample_id: Bluteprobe.sample_id };
      rowsBluteprobe.push(temp);
    });

    doc.text(this.title1.nativeElement.innerHTML, 14, 30);
    autoTable(doc, {
      columns: columnsNasenabstricht,
      body: rowsNasenabstricht,
      startY: 40,
    });
    doc.text(
      this.title2.nativeElement.innerHTML,
      14,
      (doc as any).autoTable.previous.finalY + 20
    );
    autoTable(doc, {
      columns: columnsBluteproben,
      body: rowsBluteprobe,
      startY: (doc as any).autoTable.previous.finalY + 30,
    });
    doc.save(fileName);
  }
}
