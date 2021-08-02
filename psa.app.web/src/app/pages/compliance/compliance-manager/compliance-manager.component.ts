/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogViewComplianceComponent } from '../compliance-view-dialog/dialog-view-compliance.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AlertService } from '../../../_services/alert.service';
import { ProbandsListEntryActionConfig } from '../../../features/probands-list/probands-list.component';
import { ComplianceAgreement } from '../../../psa.app.core/models/compliance';
import { CompliancesFilter } from './compliances-filter';
import { QuestionnaireService } from '../../../psa.app.core/providers/questionnaire-service/questionnaire-service';
import { ComplianceService } from '../../../psa.app.core/providers/compliance-service/compliance-service';

@Component({
  selector: 'app-compliance-manager',
  templateUrl: './compliance-manager.component.html',
  styleUrls: ['./compliance-manager.component.scss'],
})
export class ComplianceManagerComponent implements OnInit {
  constructor(
    private readonly dialog: MatDialog,
    private readonly complianceService: ComplianceService,
    private readonly questionnaireService: QuestionnaireService,
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
      const studiesResp = await this.questionnaireService.getStudies();
      this.studyFilterValues = studiesResp.studies.map((value) => value.name);
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
    const dialogData = {
      study: this.activeFilter.studyName,
      complianceId,
    };
    this.dialog.open(DialogViewComplianceComponent, {
      width: '500px',
      autoFocus: true,
      disableClose: false,
      data: dialogData,
    });
  }
}
