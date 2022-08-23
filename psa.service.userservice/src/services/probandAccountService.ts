/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ProbandAccount } from '../models/account';
import { probandAuthClient } from '../clients/authServerClient';
import { AccountService, SafeUserRepresentation } from './accountService';
import { AccountNotFound } from '../errors';
import assert from 'assert';

/**
 * Manages proband accounts in authserver
 */
export class ProbandAccountService extends AccountService {
  public static async getProbandAccount(
    username: string
  ): Promise<ProbandAccount> {
    return await this.mapSafeUserRepresentationToProbandAccount(
      await this.getUserOrFail(username, probandAuthClient)
    );
  }

  public static async getProbandAccountsByStudyName(
    studyName: string
  ): Promise<ProbandAccount[]> {
    const users = await this.getAccountsByStudyName(
      studyName,
      probandAuthClient
    );
    return users.map((user) => ({
      username: user.username,
      role: 'Proband',
      study: studyName,
    }));
  }

  public static async createProbandAccount(
    username: string,
    studyName: string,
    password: string,
    temporaryPassword: boolean
  ): Promise<void> {
    await this.createAccount(
      {
        username,
        role: 'Proband',
        studies: [studyName],
        password,
      },
      probandAuthClient,
      temporaryPassword
    );
  }

  public static async deleteProbandAccount(
    username: string,
    failIfNotFound = true
  ): Promise<void> {
    try {
      const { id } = await this.getUserOrFail(username, probandAuthClient);
      await probandAuthClient.users.del({
        id,
        realm: probandAuthClient.realm,
      });
    } catch (err) {
      if (err instanceof AccountNotFound && !failIfNotFound) {
        return;
      }
      throw err;
    }
  }

  public static async createStudy(studyName: string): Promise<void> {
    await this.createGroup(studyName, probandAuthClient);
  }

  public static async deleteStudy(studyName: string): Promise<void> {
    await this.deleteGroupByName(studyName, probandAuthClient);
  }

  private static async mapSafeUserRepresentationToProbandAccount(
    user: SafeUserRepresentation
  ): Promise<ProbandAccount> {
    const groups = await this.getGroupNamesByUserId(user.id, probandAuthClient);
    assert(groups[0], 'Proband account is not assigned to a study');
    return {
      username: user.username,
      role: 'Proband',
      study: groups[0],
    };
  }
}
