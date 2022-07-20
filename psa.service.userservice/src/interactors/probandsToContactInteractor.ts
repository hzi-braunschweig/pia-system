/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import pgHelper from '../services/postgresqlHelper';
import { AccessToken, asyncMap } from '@pia/lib-service-core';
import {
  ProbandsToContactRequest,
  ProbandToContact,
  ProbandToContactDto,
} from '../models/probandsToContact';
import { ProbandAccountService } from '../services/probandAccountService';
import { AccountStatus } from '../models/accountStatus';

export class ProbandsToContactInteractor {
  public static async getProbandsToContact(
    decodedToken: AccessToken
  ): Promise<ProbandToContactDto[]> {
    try {
      const probandsToContact = (await pgHelper.getProbandsToContact(
        decodedToken.studies
      )) as ProbandToContact[];

      const probandsWithAccount: string[] = (
        await asyncMap(
          probandsToContact.map((proband) => proband.study),
          async (study) =>
            await ProbandAccountService.getProbandAccountsByStudyName(study)
        )
      )
        .flat()
        .map((account) => account.username);

      return probandsToContact.map((proband) => ({
        ...proband,
        accountStatus: probandsWithAccount.includes(proband.user_id)
          ? AccountStatus.ACCOUNT
          : AccountStatus.NO_ACCOUNT,
      }));
    } catch (err) {
      console.log(err);
      throw new Error('Could not get the probands to contact');
    }
  }

  public static async updateProbandsToContact(
    id: number,
    data: ProbandsToContactRequest
  ): Promise<void> {
    await pgHelper.updateProbandToContact(id, data).catch((err) => {
      console.log(err);
      throw new Error('The proband to contact could not be updated');
    });
  }
}
