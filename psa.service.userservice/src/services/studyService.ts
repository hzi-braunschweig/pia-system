/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AdditionalAuthserverFields, DbStudy, Study } from '../models/study';
import { ProfessionalAccountService } from './professionalAccountService';
import { ProbandAccountService } from './probandAccountService';
import { personaldataserviceClient } from '../clients/personaldataserviceClient';
import { MailService } from '@pia/lib-service-core';
import { StudyWelcomeMailService } from './studyWelcomeMailService';

export class StudyService {
  private static readonly requireTotpRole = 'feature:RequireTotp';

  private static readonly maxAccountsCountAttributeName = 'maxAccountsCount';

  public static async mapDbStudyToStudy(study: DbStudy): Promise<Study> {
    const additionalFields: AdditionalAuthserverFields = {
      proband_realm_group_id: null,
      has_required_totp: false,
      has_open_self_registration: false,
      max_allowed_accounts_count: null,
      accounts_count: 0,
    };

    if (study.status !== 'deleted') {
      const max_allowed_accounts_count =
        await this.getMaxAllowedAccountsCountOfStudy(study.name);

      additionalFields.proband_realm_group_id =
        await ProbandAccountService.getGroupIdOfStudy(study.name);
      additionalFields.has_required_totp =
        await ProfessionalAccountService.hasGroupRealmRoleMapping(
          this.requireTotpRole,
          study.name
        );
      additionalFields.max_allowed_accounts_count = max_allowed_accounts_count;
      additionalFields.has_open_self_registration =
        max_allowed_accounts_count !== null;
      additionalFields.accounts_count = await this.getCurrentAccountsCount(
        study.name
      );
    }

    return {
      ...study,
      ...additionalFields,
    };
  }

  public static async setTotpRequiredForStudy(
    isTotpRequired: boolean | null,
    studyName: string
  ): Promise<void> {
    if (isTotpRequired === true) {
      await ProfessionalAccountService.addRealmRoleMappingToGroup(
        this.requireTotpRole,
        studyName
      );
    } else if (
      isTotpRequired === false &&
      (await ProfessionalAccountService.hasGroupRealmRoleMapping(
        this.requireTotpRole,
        studyName
      ))
    ) {
      await ProfessionalAccountService.removeRealmRoleMappingFromGroup(
        this.requireTotpRole,
        studyName
      );
    }
  }

  public static async updateMaxAllowedAccountsCountOfStudy(
    study: Study
  ): Promise<void> {
    if (
      study.has_open_self_registration &&
      study.max_allowed_accounts_count !== null
    ) {
      await ProbandAccountService.setGroupAttribute(
        this.maxAccountsCountAttributeName,
        study.max_allowed_accounts_count,
        study.name
      );
    } else {
      await ProbandAccountService.deleteGroupAttribute(
        this.maxAccountsCountAttributeName,
        study.name
      );
    }
  }

  public static async getMaxAllowedAccountsCountOfStudy(
    studyName: string
  ): Promise<number | null> {
    const groupAttributes = await ProbandAccountService.getGroupAttributes(
      studyName
    );
    return groupAttributes[this.maxAccountsCountAttributeName]
      ? Number(groupAttributes[this.maxAccountsCountAttributeName])
      : null;
  }

  public static async saveVerifiedEmailAddress(
    pseudonym: string
  ): Promise<string> {
    const email = await ProbandAccountService.getProbandAccountEmailAddress(
      pseudonym
    );
    await personaldataserviceClient.updatePersonalData(
      pseudonym,
      {
        email,
      },
      true
    );
    console.log(
      `onProbandEmailVerified: saved verified email address of proband "${pseudonym}" in personaldataservice`
    );
    return email;
  }

  public static async sendWelcomeMail(
    pseudonym: string,
    email: string
  ): Promise<void> {
    const content = await StudyWelcomeMailService.getStudyWelcomeMailContent(
      pseudonym
    );
    const isSent = await MailService.sendMail(email, content);
    if (isSent) {
      console.log(
        `onProbandEmailVerified: successfully sent welcome mail to proband with pseudonym "${pseudonym}"`
      );
    } else {
      console.log(
        `onProbandEmailVerified: welcome mail to proband "${pseudonym}" has not been accepted`
      );
    }
  }

  public static async getCurrentAccountsCount(
    studyName: string
  ): Promise<number> {
    return (
      await ProbandAccountService.getProbandAccountsByStudyName(studyName)
    ).length;
  }
}
