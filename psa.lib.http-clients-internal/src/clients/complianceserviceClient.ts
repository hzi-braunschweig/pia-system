/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServiceClient } from '../core/serviceClient';

export enum SystemComplianceType {
  APP = 'app',
  SAMPLES = 'samples',
  BLOODSAMPLES = 'bloodsamples',
  LABRESULTS = 'labresults',
}

export class ComplianceserviceClient extends ServiceClient {
  /**
   * Checks if the user has given requested compliance
   */
  public async hasAgreedToCompliance(
    pseudonym: string,
    study: string,
    systemCompliance: SystemComplianceType | SystemComplianceType[]
  ): Promise<boolean> {
    let query;
    if (Array.isArray(systemCompliance)) {
      query =
        '?' + systemCompliance.map((comp) => 'system[]=' + comp).join('&');
    } else {
      query = '?system=' + systemCompliance;
    }
    return await this.httpClient.get<boolean>(
      `/compliance/${study}/agree/${pseudonym}` + query
    );
  }
}
