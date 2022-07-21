/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';
import { PersonalDataService } from 'src/app/psa.app.core/providers/personaldata-service/personaldata-service';
import { DataService } from '../../../_services/data.service';
import { DialogOkCancelComponent } from '../../../_helpers/dialog-ok-cancel';
import { fromEvent, Observable } from 'rxjs';
import { MediaObserver } from '@angular/flex-layout';
import { SampleTrackingService } from 'src/app/psa.app.core/providers/sample-tracking-service/sample-tracking.service';
import { AbstractControl, FormControl, Validators } from '@angular/forms';
import { MatPaginatorIntlGerman } from '../../../_helpers/mat-paginator-intl';
import { AccountStatusPipe } from '../../../pipes/account-status.pipe';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  startWith,
} from 'rxjs/operators';
import { CurrentUser } from '../../../_services/current-user.service';
import { ProbandService } from '../../../psa.app.core/providers/proband-service/proband.service';
import { PersonalData } from '../../../psa.app.core/models/personalData';

@Component({
  selector: 'app-sample-management',
  templateUrl: './sample-management.component.html',
  styleUrls: ['./sample-management.component.scss'],
  providers: [
    {
      provide: MatPaginatorIntl,
      useClass: MatPaginatorIntlGerman,
    },
  ],
})
export class SampleManagementComponent implements OnInit {
  isLoading = false;
  studyName = new FormControl(null, [Validators.required]);
  dataSource: MatTableDataSource<any>;
  dataWithProbandsWhoNeedsMaterial = [];
  data = [];
  public cols: Observable<number>;
  sample_id = new FormControl('');
  personalDataAllStudies: PersonalData[];

  constructor(
    public currentUser: CurrentUser,
    private probandService: ProbandService,
    private router: Router,
    private matDialog: MatDialog,
    private sampleTrackingService: SampleTrackingService,
    private mediaObserver: MediaObserver,
    private dataService: DataService,
    private personalDataService: PersonalDataService,
    private accountStatusPipe: AccountStatusPipe
  ) {
    const gridAns = new Map([
      ['xs', 1],
      ['sm', 2],
      ['md', 3],
      ['lg', 5],
      ['xl', 5],
    ]);
    let startCond2: number;
    gridAns.forEach((cols, mqAlias) => {
      if (this.mediaObserver.isActive(mqAlias)) {
        startCond2 = cols;
      }
    });
    this.cols = this.mediaObserver.media$
      .pipe(map((change) => gridAns.get(change.mqAlias)))
      .pipe(startWith(startCond2));
  }

  displayedColumns = [
    'select',
    'needs_material',
    'username',
    'ids',
    'vorname',
    'name',
    'status',
    'view',
  ];
  selection = new SelectionModel<any>(true, []);
  @ViewChild('filter', { static: true }) filter: ElementRef;
  @ViewChild('filterInputSampleID', { static: true })
  filterInputSampleID: ElementRef;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  needsMaterialFilterCheckbox: any;

  async ngOnInit(): Promise<void> {
    this.personalDataAllStudies =
      await this.personalDataService.getPersonalDataAll();

    this.studyName.valueChanges.subscribe(
      async (studyName) => await this.initTable(studyName)
    );

    fromEvent(this.filter.nativeElement, 'keyup')
      .pipe(filter(() => !!this.dataSource))
      .pipe(debounceTime(150))
      .pipe(distinctUntilChanged())
      .subscribe(
        () => (this.dataSource.filter = this.filter.nativeElement.value)
      );
  }

  async initTable(studyName: string): Promise<void> {
    this.isLoading = true;
    this.data = [];
    this.dataWithProbandsWhoNeedsMaterial = [];
    const probands = await this.probandService.getProbands(studyName);

    const data = probands.map((proband) => {
      const probandPersonalData = this.personalDataAllStudies.find(
        (res) => res.pseudonym === proband.pseudonym
      );

      return {
        username: proband.pseudonym === proband.ids ? '' : proband.pseudonym,
        ids: proband.ids,
        vorname: probandPersonalData?.vorname ?? '',
        name: probandPersonalData?.name ?? '',
        needs_material: proband.needsMaterial,
        strasse: probandPersonalData?.strasse ?? '',
        haus_nr: probandPersonalData?.haus_nr ?? '',
        plz: probandPersonalData?.plz ?? '',
        ort: probandPersonalData?.ort ?? '',
        anrede: probandPersonalData?.anrede ?? '',
        titel: probandPersonalData?.titel ?? '',
        status: this.accountStatusPipe.transform(proband),
      };
    });

    this.data = data;
    this.dataWithProbandsWhoNeedsMaterial = data.filter(
      (proband) => proband.needs_material
    );

    this.dataSource = new MatTableDataSource(this.data);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.isLoading = false;
  }

  validateSampleID(control: AbstractControl): any {
    const regexp = new RegExp('^ZIFCO-[0-9]{10}$', 'i');
    if (!control.value || !regexp.test(control.value)) {
      return { sampleWrongFormat: true };
    } else {
      return null;
    }
  }

  filterSelectMethod(): void {
    if (!this.dataSource) {
      return;
    }
  }

  resetFilter(): void {
    this.dataSource.filter = '';
  }

  onClickViewSampleListForUser(username: string, status: string): void {
    let deactivated;
    if (status === 'PROBANDEN.STATUS_DEACTIVATED') {
      deactivated = true;
    } else {
      deactivated = false;
    }
    this.router.navigate(['/sample-management/', username], {
      queryParams: { deactivated },
    });
  }

  showOnlyProbandsWhoNeedsMaterial(): void {
    if (this.needsMaterialFilterCheckbox) {
      this.paginator.pageIndex = 0;
      this.dataSource.data = this.dataWithProbandsWhoNeedsMaterial;
    } else {
      this.dataSource.data = this.data;
    }
  }

  filterTableWithProbenID(filterSampleID: string): void {
    const usersArray = [];
    const newData = [];
    filterSampleID = filterSampleID.trim(); // Remove whitespace
    filterSampleID = filterSampleID.toUpperCase(); // MatTableDataSource defaults to lowercase matches

    if (filterSampleID === '') {
      this.sample_id.setValue('');
      this.dataSource.data = this.data;
    } else {
      this.sampleTrackingService.getLabResultsForSampleID(filterSampleID).then(
        (labResult) => {
          usersArray.push(labResult.user_id);
          this.geBloodSamplesForBloodSampleID(
            usersArray,
            filterSampleID,
            newData
          );
        },
        (err) => {
          this.geBloodSamplesForBloodSampleID(
            usersArray,
            filterSampleID,
            newData
          );
        }
      );
    }
  }

  geBloodSamplesForBloodSampleID(
    usersArray: Array<any>,
    filterSampleID: string,
    newData: Array<any>
  ): void {
    this.sampleTrackingService
      .getBloodSamplesForBloodSampleID(filterSampleID)
      .then(
        (response) => {
          response.forEach((bloodSample) => {
            usersArray.push(bloodSample.user_id);
          });
          usersArray.forEach((probandUsername) => {
            this.dataSource.data.forEach((proband) => {
              if (proband.username === probandUsername) {
                newData.push(proband);
              }
            });
          });
          this.dataSource.data = newData;
        },
        (err: any) => {
          usersArray.forEach((probandUsername) => {
            this.dataSource.data.forEach((proband) => {
              if (proband.username === probandUsername) {
                newData.push(proband);
              }
            });
          });
          this.dataSource.data = newData;
        }
      );
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle(): void {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.filteredData.forEach((row) =>
          this.selection.select(row)
        );
  }

  createLetters(): void {
    const probandsForLetters = [];
    if (this.selection.selected.length !== 0) {
      this.selection.selected.forEach((proband, probandIndex) => {
        if (
          proband.vorname !== '' &&
          proband.name !== '' &&
          proband.strasse !== '' &&
          proband.haus_nr !== '' &&
          proband.plz !== '' &&
          proband.ort !== ''
        ) {
          probandsForLetters.push(proband);
        }
      });
      if (probandsForLetters.length !== 0) {
        this.dataService.setProbandsForCreateLetters(probandsForLetters);
        this.router.navigate(['/collective-sample-letters']);
      } else {
        this.openDialog();
      }
    }
  }

  openDialog(): void {
    const dialogRef = this.matDialog.open(DialogOkCancelComponent, {
      width: '450px',
      data: {
        q: 'SAMPLE_MANAGEMENT.COLLECTIVE_LETTERS',
        content: 'SAMPLE_MANAGEMENT.NO_PROBAND_WITH_ADDRESS',
      },
    });
  }
}
