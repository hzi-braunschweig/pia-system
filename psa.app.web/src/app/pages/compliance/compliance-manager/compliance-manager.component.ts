/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  DialogViewComplianceComponent,
  DialogViewComplianceComponentData,
} from '../compliance-view-dialog/dialog-view-compliance.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AlertService } from '../../../_services/alert.service';
import { ProbandsListEntryActionConfig } from '../../../features/probands-list/probands-list.component';
import { ComplianceAgreement } from '../../../psa.app.core/models/compliance';
import { CompliancesFilter } from './compliances-filter';
import { UserService } from '../../../psa.app.core/providers/user-service/user.service';
import { ComplianceService } from '../../../psa.app.core/providers/compliance-service/compliance-service';
import { HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-compliance-manager',
  templateUrl: './compliance-manager.component.html',
  styleUrls: ['./compliance-manager.component.scss'],
})
export class ComplianceManagerComponent implements OnInit {
  constructor(
    private readonly dialog: MatDialog,
    private readonly complianceService: ComplianceService,
    private readonly userService: UserService,
    private readonly alertService: AlertService
  ) {}

  @ViewChild(MatPaginator, { static: true })
  paginator: MatPaginator;

  @ViewChild(MatSort, { static: true })
  sort: MatSort;

  @Input()
  displayedColumns = [
    'lastname',
    'firstname',
    'birthdate',
    'ids',
    'viewCompliance',
  ];

  activeFilter: CompliancesFilter = new CompliancesFilter();

  dataSource: MatTableDataSource<ComplianceAgreement> =
    new MatTableDataSource<ComplianceAgreement>([]);

  studyFilterValues: string[];
  customFilterValue: string;

  entryActions: Map<string, ProbandsListEntryActionConfig> = new Map<
    string,
    ProbandsListEntryActionConfig
  >();

  isLoading = true;

  ngOnInit(): void {
    this.fetchComplianceAgreements();
  }

  /**
   * Asures that the filter will be updated within the data source
   * and the page is reset to the first page
   */
  updateFilter(): void {
    this.dataSource.filter = this.activeFilter.filterKey;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  /**
   * Configure DataSource. Has to be done on init as ViewChilds need to be available.
   */
  async fetchComplianceAgreements(): Promise<void> {
    try {
      const compliances =
        await this.complianceService.getAllCompliancesForProfessional();
      this.studyFilterValues = (await this.userService.getStudies()).map(
        (value) => value.name
      );
      this.dataSource = new MatTableDataSource<ComplianceAgreement>(
        compliances
      );
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.dataSource.filterPredicate = (data) =>
        this.activeFilter.filter(data);
      this.updateFilter();

      this.isLoading = false;
    } catch (error) {
      this.alertService.errorObject(error);
      this.isLoading = false;
    }
  }

  showComplianceDetails(complianceId): void {
    const dialogData: DialogViewComplianceComponentData = {
      study: this.activeFilter.studyName,
      complianceId,
    };
    this.dialog.open<
      DialogViewComplianceComponent,
      DialogViewComplianceComponentData
    >(DialogViewComplianceComponent, {
      width: '500px',
      autoFocus: true,
      disableClose: false,
      data: dialogData,
    });
  }

  downloadAllCompliances(): void {
    if (!this.activeFilter.studyName) {
      throw new Error('No study selected');
    }

    this.isLoading = true;

    const responseStream = this.complianceService.getExportData(
      this.activeFilter.studyName
    );

    this.saveExportFile(responseStream);
  }

  saveExportFile(responseStream: Observable<HttpEvent<Blob>>): void {
    responseStream.subscribe({
      next: (response: HttpResponse<Blob>) => {
        const downloadLink = document.createElement('a');
        downloadLink.href = window.URL.createObjectURL(response.body);
        downloadLink.setAttribute('download', 'export.zip');
        document.body.appendChild(downloadLink);
        downloadLink.click();

        this.isLoading = false;
      },
      error: (error) => {
        this.alertService.errorObject(error);
        this.isLoading = false;
      },
    });
  }
}
