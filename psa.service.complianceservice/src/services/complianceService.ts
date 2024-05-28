/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import complianceTextRepository from '../repositories/complianceTextRepository';
import complianceRepository from '../repositories/complianceRepository';
import { userserviceClient } from '../clients/userserviceClient';
import ComplianceMapper from '../services/complianceMapper';
import { Request as HapiRequest } from '@hapi/hapi';
import { ComplianceRes } from '../model/compliance';
import { Compliance } from '../db';
import TransactionWrapper from '../utils/transactionWrapper';

interface IOptions {
  transaction: TransactionWrapper;
}

export class ComplianceService {
  /**
   * Checks whether the internal compliance is active for a study, which currently means:
   * is there a compliance text, written by the researcher.
   * @return true if internal compliance is active ...
   */
  public static async isInternalComplianceActive(
    study: string,
    options?: IOptions
  ): Promise<boolean> {
    const complianceText: unknown =
      await complianceTextRepository.getComplianceText(study, options);
    return !!complianceText;
  }

  /**
   * Gets the compliance of a user for a study
   */
  public static async getComplianceAgree(
    _request: HapiRequest,
    study: string,
    userId: string,
    mappingId: string | null = null,
    options?: IOptions
  ): Promise<ComplianceRes> {
    let agree;
    if (await this.isInternalComplianceActive(study)) {
      if (!mappingId) {
        mappingId = await userserviceClient.lookupMappingId(userId);
      }
      const complianceAgree =
        await complianceRepository.getComplianceOfUserForStudy(
          study,
          mappingId,
          options
        );
      if (complianceAgree) {
        agree = ComplianceMapper.mapInternalCompliance(complianceAgree);
      } else {
        agree = null;
      }
    } else {
      const externalCompliance =
        await userserviceClient.retrieveUserExternalCompliance(userId);
      agree = ComplianceMapper.mapExternalCompliance(externalCompliance);
    }
    return agree;
  }

  /**
   * Gets the compliance for a professional user based on the given studies array
   * Applies the given mapping to the internal representation of the compliance
   */
  public static async getComplianceAgreementsForStudies(
    studies: string[],
    mapCompliance: (
      complianceAgreement: typeof Compliance
    ) => Promise<ComplianceRes> = ComplianceMapper.mapComplianceForComplianceManager.bind(
      ComplianceMapper
    )
  ): Promise<ComplianceRes[]> {
    const complianceAgreements =
      await complianceRepository.getCompliancesForStudies(studies);
    const complianceAgreementsArray = complianceAgreements.map(
      async (complianceAgreement) => mapCompliance(complianceAgreement)
    );
    return Promise.all(complianceAgreementsArray);
  }
}
