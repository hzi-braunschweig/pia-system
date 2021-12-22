/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServiceClient } from '../core/serviceClient';
import {
  ProbandInternalDto,
  ProbandRequestInternalDto,
  ProbandResponseInternalDto,
  ProbandStatus,
} from '../dtos/proband';
import { StudyInternalDto } from '../dtos/study';
import { ExternalComplianceInternalDto } from '../dtos/externalCompliance';

export interface PseudonymsFilter {
  study?: string;
  complianceContact?: boolean;
  probandStatus?: ProbandStatus | ProbandStatus[];
}

export class UserserviceClient extends ServiceClient {
  /**
   * Gets all pseudonyms from pia that are in a specific study or have a specific status account
   */
  public async getPseudonyms(filter: PseudonymsFilter = {}): Promise<string[]> {
    const query = new URLSearchParams();
    if (typeof filter.study === 'string') {
      query.append('study', filter.study);
    }
    if (typeof filter.complianceContact === 'boolean') {
      query.append('complianceContact', filter.complianceContact.toString());
    }
    if (typeof filter.probandStatus === 'string') {
      query.append('status', filter.probandStatus);
    } else if (Array.isArray(filter.probandStatus)) {
      filter.probandStatus.forEach((status) => query.append('status', status));
    }
    return await this.httpClient.get<string[]>(
      `/user/pseudonyms?${query.toString()}`
    );
  }

  /**
   * Look up a user's ids
   */
  public async lookupIds(pseudonym: string): Promise<string | null> {
    return await this.httpClient.get(`/user/users/${pseudonym}/ids`, {
      responseType: 'text',
      returnNullWhenNotFound: true,
    });
  }

  /**
   * Look up a probands's mappingId
   */
  public async lookupMappingId(pseudonym: string): Promise<string> {
    return await this.httpClient.get<string>(
      `/user/users/${pseudonym}/mappingId`,
      {
        responseType: 'text',
      }
    );
  }

  /**
   * Retrieves the user's external compliance
   */
  public async retrieveUserExternalCompliance(
    pseudonym: string
  ): Promise<ExternalComplianceInternalDto> {
    return await this.httpClient.get<ExternalComplianceInternalDto>(
      `/user/users/${pseudonym}/externalcompliance`
    );
  }

  public async getProbandsWithAccessToFromProfessional(
    username: string
  ): Promise<string[]> {
    return await this.httpClient.get<string[]>(
      `/user/professional/${username}/allProbands`
    );
  }

  public async getProband(
    pseudonym: string
  ): Promise<ProbandInternalDto | null> {
    return await this.httpClient.get<ProbandInternalDto>(
      `/user/users/${pseudonym}`,
      { returnNullWhenNotFound: true }
    );
  }

  public async isProbandExistentByUsername(
    pseudonym: string
  ): Promise<boolean> {
    return (await this.getProband(pseudonym)) !== null;
  }

  /**
   * Returns study name or null if proband does not exist
   * @param pseudonym
   */
  public async getStudyOfProband(pseudonym: string): Promise<string | null> {
    const proband = await this.getProband(pseudonym);
    return proband?.study ?? null;
  }

  public async deleteProbanddata(
    pseudonym: string,
    keepUsageData: boolean,
    isFullDeletion: boolean
  ): Promise<void> {
    const params = new URLSearchParams({
      keepUsageData: keepUsageData.toString(),
      full: isFullDeletion.toString(),
    });
    return await this.httpClient.delete(
      `/user/users/${pseudonym}?${params.toString()}`
    );
  }

  public async getProbandByIDS(
    ids: string
  ): Promise<ProbandInternalDto | null> {
    return await this.httpClient.get<ProbandInternalDto | null>(
      `/user/users/ids/${ids}`,
      {
        returnNullWhenNotFound: true,
      }
    );
  }

  public async registerProband(
    studyName: string,
    newProband: ProbandRequestInternalDto
  ): Promise<ProbandResponseInternalDto> {
    return await this.httpClient.post<ProbandResponseInternalDto>(
      `/user/studies/${studyName}/probands`,
      newProband
    );
  }

  public async getStudy(studyName: string): Promise<StudyInternalDto | null> {
    return await this.httpClient.get(`/user/studies/${studyName}`, {
      returnNullWhenNotFound: true,
    });
  }

  public async patchProband(
    pseudonym: string,
    attributes:
      | Pick<ProbandInternalDto, 'status'>
      | Pick<ProbandInternalDto, 'complianceContact'>
  ): Promise<void> {
    return await this.httpClient.patch<void>(
      `/user/users/${pseudonym}`,
      attributes
    );
  }
}
