/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Proband } from '../../models/proband';
import { PendingComplianceChange } from '../../models/pendingComplianceChange';
import { PendingProbandDeletion } from '../../models/pendingDeletion';
import { ProbandToContact } from '../../models/probandToContact';
import { map } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProbandService {
  public constructor(public http: HttpClient) {}
  private readonly apiUrl = 'api/v1/user/';

  private mapProbandsToContact = map(
    (probandsToContact: ProbandToContact[]): ProbandToContact[] => {
      return probandsToContact.map((probandToContact) =>
        ProbandService.formatProbandToContactDates(probandToContact)
      );
    }
  );

  private static formatProbandToContactDates(
    probandToContact: ProbandToContact
  ): ProbandToContact {
    probandToContact.is_notable_answer_at =
      typeof probandToContact.is_notable_answer_at === 'string'
        ? new Date(probandToContact.is_notable_answer_at)
        : null;
    probandToContact.is_not_filledout_at =
      typeof probandToContact.is_not_filledout_at === 'string'
        ? new Date(probandToContact.is_not_filledout_at)
        : null;
    probandToContact.processed_at =
      typeof probandToContact.processed_at === 'string'
        ? new Date(probandToContact.processed_at)
        : null;
    probandToContact.created_at =
      typeof probandToContact.created_at === 'string'
        ? new Date(probandToContact.created_at)
        : null;
    return probandToContact;
  }

  /**
   * Get a list of all probands of a study
   */
  public getProbands(studyName: string): Promise<Proband[]> {
    return this.http
      .get<Proband[]>(`${this.apiUrl}studies/${studyName}/probands`)
      .toPromise();
  }

  /**
   * Get a zip containing the idat of all probands of a study
   */
  public getProbandsExport(
    studyName: string
  ): Promise<{ probandsExport: string }> {
    return firstValueFrom(
      this.http.get<{ probandsExport: string }>(
        `${this.apiUrl}studies/${studyName}/probands/export`
      )
    );
  }

  /**
   * Get probands that need to be contacted
   * @return a list of probands info
   */
  public async getProbandsToContact(): Promise<ProbandToContact[]> {
    return this.http
      .get<ProbandToContact[]>(this.apiUrl + `probandstocontact`)
      .pipe(this.mapProbandsToContact)
      .toPromise();
  }

  public async putProbandToContact(
    id: number,
    putData: Partial<ProbandToContact>
  ): Promise<void> {
    await this.http
      .put(this.apiUrl + 'probandstocontact/' + id, putData)
      .toPromise();
  }

  public async getPendingComplianceChanges(
    studyName: string
  ): Promise<PendingComplianceChange[]> {
    return this.http
      .get<PendingComplianceChange[]>(
        `${this.apiUrl}studies/${studyName}/pendingcompliancechanges`
      )
      .toPromise();
  }

  public async getPendingProbandDeletions(
    studyName: string
  ): Promise<PendingProbandDeletion[]> {
    return this.http
      .get<PendingProbandDeletion[]>(
        `${this.apiUrl}studies/${studyName}/pendingdeletions?type=proband`
      )
      .toPromise();
  }
}
