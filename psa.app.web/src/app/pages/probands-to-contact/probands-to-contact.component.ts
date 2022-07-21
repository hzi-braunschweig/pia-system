/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit, ViewChild } from '@angular/core';
import { PersonalDataService } from 'src/app/psa.app.core/providers/personaldata-service/personaldata-service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AlertService } from '../../_services/alert.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ProbandService } from '../../psa.app.core/providers/proband-service/proband.service';
import { DialogPopUpComponent } from '../../_helpers/dialog-pop-up';
import { AccountStatusPipe } from '../../pipes/account-status.pipe';

export interface TableRow {
  id: number;
  username: string;
  ids: string;
  firstname: string;
  lastname: string;
  accountStatus: string;
  notable: boolean;
  notable_timestamp: Date | null;
  notableAnswerQIs: string[];
  notFilledout: boolean;
  notFilledout_timestamp: Date | null;
  notFilledoutQIs: string[];
  processed: boolean;
}

@Component({
  templateUrl: 'probands-to-contact.component.html',
  styleUrls: ['./probands-to-contact.component.scss'],
})
export class ProbandsToContactComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true })
  private paginator: MatPaginator;
  @ViewChild(MatSort, { static: true })
  private sort: MatSort;
  public dataSource: MatTableDataSource<TableRow> =
    new MatTableDataSource<TableRow>();
  public cols: Observable<number>;
  public displayedColumns = [
    'username',
    'ids',
    'firstname',
    'lastname',
    'accountStatus',
    'notableAnswerQIs',
    'notable',
    'notFilledoutQIs',
    'notFilledout',
    'processed',
    'contact',
    'view',
  ];
  public isLoading: boolean;

  public constructor(
    private probandService: ProbandService,
    private matDialog: MatDialog,
    private alertService: AlertService,
    private router: Router,
    private personalDataService: PersonalDataService,
    private accountStatusPipe: AccountStatusPipe
  ) {}

  private static aggregateAndCountQuestionnaires(
    questionnaireNames: string[]
  ): string[] {
    return Array.from(
      questionnaireNames.reduce((map, currentValue) => {
        const qName = currentValue;
        if (map.has(qName)) {
          map.set(qName, map.get(qName) + 1);
        } else {
          map.set(qName, 1);
        }
        return map;
      }, new Map<string, number>())
    ).map(([questionnaire, count]) => `${questionnaire} (${count})`);
  }

  public async ngOnInit(): Promise<void> {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    await this.initTable();
  }

  public filterByNotableAnswer(): void {
    this.dataSource.filterPredicate = (data, filter): boolean => {
      return (
        String(data.notable).includes(filter) &&
        String(data.processed).includes('false')
      );
    };
    this.dataSource.filter = 'true';
  }

  public filterByNotFilledout(): void {
    this.dataSource.filterPredicate = (data, filter): boolean => {
      return (
        String(data.notFilledout).includes(filter) &&
        String(data.processed).includes('false')
      );
    };
    this.dataSource.filter = 'true';
  }

  public resetFilter(): void {
    this.dataSource.filter = '';
  }

  public contactProband(username: string): void {
    this.router.navigate(['/contact-proband/', username]);
  }

  public viewContactInfo(username): void {
    this.router.navigate(['/probands-personal-info/', username]);
  }

  public async setProcessed(id, processed: boolean): Promise<void> {
    try {
      await this.probandService.putProbandToContact(id, { processed });
      this.dataSource.data.forEach((part) => {
        if (part.id === id) {
          part.processed = processed;
        }
      });
      this.showResultDialog(
        'PROBANDS_TO_CONTACT.PROCESSED_STATUS_CHANGED',
        true
      );
    } catch (error) {
      this.alertService.errorObject(error);
    }
  }

  private async initTable(): Promise<void> {
    this.isLoading = true;
    const data = [];

    try {
      const probandsPersonalData =
        await this.personalDataService.getPersonalDataAll();
      const probands = await this.probandService.getProbandsToContact();
      for (const probandToContact of probands) {
        const personalDataForPseudonym = probandsPersonalData.find(
          (res) => res.pseudonym === probandToContact.user_id
        );

        const notableAnswerQIs =
          ProbandsToContactComponent.aggregateAndCountQuestionnaires(
            probandToContact.notable_answer_questionnaire_instances.map(
              (qi) => qi.questionnaire_name
            )
          );
        const notFilledoutQIs =
          ProbandsToContactComponent.aggregateAndCountQuestionnaires(
            probandToContact.not_filledout_questionnaire_instances.map(
              (qi) => qi.questionnaire_name
            )
          );

        data.push({
          id: probandToContact.id,
          username:
            probandToContact.user_id === probandToContact.ids
              ? ''
              : probandToContact.user_id,
          ids: probandToContact.ids,
          firstname: personalDataForPseudonym?.vorname ?? '',
          lastname: personalDataForPseudonym?.name ?? '',
          accountStatus: this.accountStatusPipe.transform(probandToContact),
          notableAnswerQIs,
          notable: probandToContact.is_notable_answer ?? undefined,
          notable_timestamp: probandToContact.is_notable_answer_at,
          notFilledoutQIs,
          notFilledout: probandToContact.is_not_filledout ?? undefined,
          notFilledout_timestamp: probandToContact.is_not_filledout_at,
          processed: probandToContact.processed,
        });
      }
    } catch (e) {
      this.alertService.errorObject(e);
    }

    this.dataSource.data = data;
    this.isLoading = false;
  }

  private showResultDialog(info: string, success: boolean): void {
    this.matDialog.open(DialogPopUpComponent, {
      width: '400px',
      data: { content: info, isSuccess: success },
    });
  }
}
