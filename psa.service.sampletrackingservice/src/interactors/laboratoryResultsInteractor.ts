/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import postgresqlHelper from '../services/postgresqlHelper';
import complianceserviceClient from '../clients/complianceserviceClient';
import userserviceClient from '../clients/userserviceClient';
import { AccessToken } from '@pia/lib-service-core';
import { LabResult } from '../models/LabResult';
import { StudyAccess, User } from '../models/user';
import { LabResultImportHelper } from '../services/labResultImportHelper';

export class LaboratoryResultsInteractor {
  /**
   * gets all laboratory results for a user
   * @param decodedToken the jwt of the request
   * @param pseudonym the proband ID
   */
  public static async getAllLaboratoryResults(
    decodedToken: AccessToken,
    pseudonym: string
  ): Promise<LabResult[]> {
    const requesterRole = decodedToken.role;
    const requesterName = decodedToken.username;
    const requesterStudies = decodedToken.groups;

    switch (requesterRole) {
      case 'SysAdmin':
        throw Boom.forbidden('Wrong role for this command');

      case 'Proband': {
        if (requesterName !== pseudonym) {
          throw Boom.forbidden('Probands can only get labresults for themself');
        }
        const { name: studyName } = await userserviceClient.getPrimaryStudy(
          pseudonym
        );
        const hasLabresultsCompliance =
          await complianceserviceClient.hasAgreedToCompliance(
            pseudonym,
            studyName,
            'labresults'
          );
        if (!hasLabresultsCompliance) {
          throw Boom.forbidden('Proband has not complied to see lab results');
        }
        const labResults = (await postgresqlHelper.getAllLabResultsForProband(
          pseudonym
        )) as LabResult[];
        const fakeLabResult = await this.getFakeLabResultForTeststudie(
          pseudonym
        );
        if (fakeLabResult) {
          labResults.unshift(fakeLabResult);
        }
        return labResults;
      }

      case 'Forscher':
      case 'Untersuchungsteam':
      case 'ProbandenManager': {
        const overlappingStudies =
          await postgresqlHelper.getStudyAccessByStudyIDsAndUsername(
            pseudonym,
            requesterStudies
          );
        if (!overlappingStudies.length) {
          throw Boom.notFound('Proband not found in any of your studies');
        }
        return (await postgresqlHelper.getAllLabResultsByProband(
          pseudonym
        )) as LabResult[];
      }
      default:
        throw Boom.forbidden('unknown role for this command');
    }
  }

  /**
   * gets one laboratory result for a user
   * @param decodedToken the jwt of the request
   * @param pseudonym the proband ID
   * @param result_id the result ID
   */
  public static async getOneLaboratoryResult(
    decodedToken: AccessToken,
    pseudonym: string,
    result_id: string
  ): Promise<LabResult> {
    const requesterRole = decodedToken.role;
    const requesterName = decodedToken.username;
    const requesterStudies = decodedToken.groups;

    switch (requesterRole) {
      case 'SysAdmin':
      case 'Untersuchungsteam':
      case 'ProbandenManager':
        throw Boom.forbidden('Wrong role for this command');

      case 'Forscher': {
        const overlappingStudies =
          await postgresqlHelper.getStudyAccessByStudyIDsAndUsername(
            pseudonym,
            requesterStudies
          );
        if (!overlappingStudies.length) {
          throw Boom.notFound('Proband not found in any of your studies');
        }
        const labResult = (await postgresqlHelper.getLabResult(
          pseudonym,
          result_id
        )) as LabResult | null;
        if (labResult) {
          return labResult;
        } else {
          throw Boom.notFound('Could not find labresults');
        }
      }

      case 'Proband': {
        if (requesterName !== pseudonym) {
          throw Boom.forbidden('Probands can only get labresults for themself');
        }
        const { name: studyName } = await userserviceClient.getPrimaryStudy(
          pseudonym
        );
        const hasLabresultsCompliance =
          await complianceserviceClient.hasAgreedToCompliance(
            pseudonym,
            studyName,
            'labresults'
          );
        if (!hasLabresultsCompliance) {
          throw Boom.forbidden('Proband has not complied to see lab results');
        }
        const labResult = (await postgresqlHelper.getLabResultForProband(
          pseudonym,
          result_id
        )) as LabResult | null;
        if (labResult) {
          return labResult;
        } else {
          const fakeLabResult = await this.getFakeLabResultForTeststudie(
            pseudonym
          );
          if (fakeLabResult) {
            return fakeLabResult;
          } else {
            throw Boom.notFound('Could not find labresults');
          }
        }
      }
      default:
        throw Boom.forbidden('unknown role for this command');
    }
  }

  /**
   * gets one laboratory result based on the sample ID
   * @param decodedToken the jwt of the request
   * @param sample_id the sample ID
   */
  public static async getLaboratoryResultWithSampleID(
    decodedToken: AccessToken,
    sample_id: string
  ): Promise<LabResult> {
    const requesterRole = decodedToken.role;
    const requesterStudies = decodedToken.groups;

    switch (requesterRole) {
      case 'SysAdmin':
      case 'Proband':
      case 'Forscher':
      case 'Untersuchungsteam':
        throw Boom.forbidden('Wrong role for this command');

      case 'ProbandenManager': {
        const labResult = (await postgresqlHelper.getLabResultById(
          sample_id
        )) as LabResult | null;
        if (!labResult) {
          throw Boom.forbidden("Laboratory sample doesn't exist");
        }
        const overlappingStudies =
          await postgresqlHelper.getStudyAccessByStudyIDsAndUsername(
            labResult.user_id,
            requesterStudies
          );
        if (!overlappingStudies.length) {
          throw Boom.forbidden('Proband not found in any of your studies');
        }
        return labResult;
      }
      default:
        throw Boom.forbidden('unknown role for this command');
    }
  }

  public static async postLabResultsImport(
    decodedToken: AccessToken
  ): Promise<'success' | 'error'> {
    const requesterRole = decodedToken.role;

    switch (requesterRole) {
      case 'SysAdmin':
      case 'Untersuchungsteam':
      case 'Proband':
      case 'Forscher':
        throw Boom.forbidden('Wrong role for this command');

      case 'ProbandenManager': {
        const results = await Promise.all([
          LabResultImportHelper.importHl7FromMhhSftp(),
          LabResultImportHelper.importCsvFromHziSftp(),
        ]);
        return results.every((result) => result === 'success')
          ? 'success'
          : 'error';
      }
      default:
        throw Boom.forbidden('unknown role for this command');
    }
  }
  /**
   * creates one laboratory result
   * @param decodedToken the jwt of the request
   * @param pseudonym the proband ID
   * @param labResult the laboratory result data
   */
  public static async createOneLaboratoryResult(
    decodedToken: AccessToken,
    pseudonym: string,
    labResult: LabResult
  ): Promise<LabResult> {
    const requesterRole = decodedToken.role;
    const requesterStudies = decodedToken.groups;

    switch (requesterRole) {
      case 'SysAdmin':
      case 'Proband':
      case 'Forscher':
        throw Boom.forbidden('Wrong role for this command');

      case 'Untersuchungsteam':
      case 'ProbandenManager': {
        const overlappingStudies =
          await postgresqlHelper.getStudyAccessByStudyIDsAndUsername(
            pseudonym,
            requesterStudies
          );
        if (!overlappingStudies.length) {
          throw Boom.forbidden('Proband not found in any of your studies');
        }

        const proband = (await postgresqlHelper.getUser(pseudonym)) as User;
        if (proband.account_status === 'deactivated') {
          throw Boom.forbidden(
            'Cannot create a lab result if proband is not active'
          );
        }

        try {
          return (await postgresqlHelper.createLabResult(
            pseudonym,
            labResult
          )) as LabResult;
        } catch (err) {
          console.log(err);
          throw Boom.conflict('sample with this id exists already');
        }
      }
      default:
        throw Boom.forbidden('unknown role for this command');
    }
  }

  /**
   * updates one laboratory result
   * @param decodedToken the jwt of the request
   * @param pseudonym the proband ID
   * @param result_id the result ID
   * @param labResult the laboratory result data
   */
  public static async updateOneLaboratoryResult(
    decodedToken: AccessToken,
    pseudonym: string,
    result_id: string,
    labResult: LabResult
  ): Promise<LabResult> {
    const requesterRole = decodedToken.role;
    const requesterName = decodedToken.username;
    const requesterStudies = decodedToken.groups;

    switch (requesterRole) {
      case 'SysAdmin':
      case 'Forscher':
        throw Boom.forbidden('Wrong role for this command');

      case 'Untersuchungsteam':
      case 'ProbandenManager': {
        const overlappingStudies =
          await postgresqlHelper.getStudyAccessByStudyIDsAndUsername(
            pseudonym,
            requesterStudies
          );
        if (!overlappingStudies.length) {
          throw Boom.forbidden('Proband not found in any of your studies');
        }

        const proband = (await postgresqlHelper.getUser(pseudonym)) as User;
        if (proband.account_status === 'deactivated') {
          throw Boom.forbidden(
            'Cannot update a lab result if proband is not active'
          );
        }

        const oldLabResult = (await postgresqlHelper.getLabResult(
          pseudonym,
          result_id
        )) as LabResult | null;
        if (!oldLabResult || oldLabResult.study_status === 'deleted') {
          throw Boom.forbidden('Labresult does not exist');
        }
        if (labResult.remark && labResult.new_samples_sent !== undefined) {
          return (await postgresqlHelper.updateLabResultAsPM(
            pseudonym,
            result_id,
            labResult
          )) as LabResult;
        } else if (labResult.status !== undefined) {
          return (await postgresqlHelper.updateStatusAsPM(
            pseudonym,
            result_id,
            labResult.status
          )) as LabResult;
        } else {
          throw Boom.forbidden('nothing to do');
        }
      }
      case 'Proband': {
        const oldLabResult = (await postgresqlHelper.getLabResult(
          pseudonym,
          result_id
        )) as LabResult | null;
        if (
          !oldLabResult ||
          oldLabResult.study_status === 'deleted' ||
          oldLabResult.study_status === 'deactivated'
        ) {
          throw Boom.forbidden('Labresult does not exist');
        }
        if (
          oldLabResult.dummy_sample_id &&
          oldLabResult.dummy_sample_id !==
            labResult.dummy_sample_id?.toUpperCase()
        ) {
          throw Boom.forbidden(
            'Dummy_sample_id does not match the one in the database'
          );
        }
        if (requesterName !== pseudonym) {
          throw Boom.forbidden('Sample_id does not belong to Proband');
        }
        if (!labResult.date_of_sampling) {
          throw Boom.forbidden('update params are missing');
        }
        if (
          oldLabResult.status !== 'new' &&
          oldLabResult.status !== 'inactive'
        ) {
          throw Boom.forbidden('swab was already sampled');
        }
        const { name: studyName } = await userserviceClient.getPrimaryStudy(
          pseudonym
        );
        const hasSamplesCompliance =
          await complianceserviceClient.hasAgreedToCompliance(
            pseudonym,
            studyName,
            'samples'
          );
        if (hasSamplesCompliance) {
          return (await postgresqlHelper.updateLabResultAsProband(
            pseudonym,
            result_id,
            labResult
          )) as LabResult;
        } else {
          throw Boom.forbidden('Proband has not complied to take samples');
        }
      }
      default:
        throw Boom.forbidden('unknown role for this command');
    }
  }

  private static async getFakeLabResultForTeststudie(
    user_id: string
  ): Promise<LabResult | null> {
    const probandAccesses = (await postgresqlHelper.getStudyAccessesByUsername(
      user_id
    )) as StudyAccess[];
    const isProbandOfTeststudie = probandAccesses.some(
      (access) => access.study_id === 'Teststudie'
    );
    if (isProbandOfTeststudie) {
      return this.createTestStudieFakeLabResult(user_id);
    } else {
      return null;
    }
  }

  private static createTestStudieFakeLabResult(user_id: string): LabResult {
    return {
      id: 'TEST-3722734171',
      user_id: user_id,
      order_id: null,
      date_of_sampling: new Date('2020-06-03T10:00').toISOString(),
      status: 'analyzed',
      remark: null,
      new_samples_sent: false,
      performing_doctor: null,
      dummy_sample_id: null,
      study_status: null,
      lab_observations: [
        {
          id: '1',
          lab_result_id: 'TEST-3722734171',
          name: 'SARS-CoV-2 RNA',
          result_value: '12,00',
          comment: null,
          date_of_analysis: new Date('2020-06-03T11:45'),
          date_of_delivery: new Date('2020-06-01T19:35'),
          date_of_announcement: new Date('2020-06-04T09:00'),
          lab_name: 'MHH',
          material: 'Nasenabstrich',
          result_string: 'negativ',
          unit: 'AU/ml',
          other_unit: '.',
          kit_name: 'LIAISON SARS-CoV-2 S1/S2 IgG-Assay (Diasorin)',
          name_id: 0,
        },
      ],
    };
  }
}
