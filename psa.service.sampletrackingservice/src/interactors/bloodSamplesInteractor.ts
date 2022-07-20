/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import postgresqlHelper from '../services/postgresqlHelper';
import pgPromise from 'pg-promise';
import queryResultErrorCode = pgPromise.errors.queryResultErrorCode;
import QueryResultError = pgPromise.errors.QueryResultError;
import { AccessToken } from '@pia/lib-service-core';
import { User } from '../models/user';
import { BloodSample } from '../models/bloodSample';
import { userserviceClient } from '../clients/userserviceClient';

export class BloodSamplesInteractor {
  /**
   * gets all the blood samples
   * @param pseudonym the proband ID
   * @param decodedToken the jwt of the request
   */
  public static async getAllBloodSamples(
    decodedToken: AccessToken,
    pseudonym: string
  ): Promise<BloodSample[]> {
    await this.assertProfessionalHasAccessToProband(
      pseudonym,
      decodedToken.studies
    );

    return (await postgresqlHelper.getAllBloodSamplesForProband(
      pseudonym
    )) as BloodSample[];
  }

  /**
   * gets one blood sample
   * @param decodedToken the jwt of the request
   * @param pseudonym the proband ID
   * @param sample_id sample ID
   */
  public static async getOneBloodSample(
    decodedToken: AccessToken,
    pseudonym: string,
    sample_id: string
  ): Promise<BloodSample[]> {
    await this.assertProfessionalHasAccessToProband(
      pseudonym,
      decodedToken.studies
    );

    return (await postgresqlHelper.getBloodSample(
      pseudonym,
      sample_id
    )) as BloodSample[];
  }

  /**
   * gets one blood sample based on the sample id
   * @param decodedToken the jwt of the request
   * @param sample_id sample ID
   */
  public static async getBloodSampleWithSampleID(
    decodedToken: AccessToken,
    sample_id: string
  ): Promise<BloodSample[]> {
    const bloodSamples = (await postgresqlHelper.getBloodSamplesBySampleId(
      sample_id
    )) as BloodSample[];

    if (!bloodSamples[0]) {
      throw Boom.notFound('Blood sample not found');
    }

    /**
     * The expectation here is, that blood samples with the same
     * sample_id always belong to the same proband (user_id). Since
     * this assumption is not ensured anywhere, we check it here and
     * throw if it does not hold true.
     * Also see {@link BloodSamplesInteractor#createOneBloodSample} and
     * {@link BloodSamplesInteractor#updateOneBloodSample}
     */
    for (const bloodSample of bloodSamples) {
      await this.assertProfessionalHasAccessToProband(
        bloodSample.user_id,
        decodedToken.studies
      );
    }
    return bloodSamples;
  }

  /**
   * creates a blood sample
   * @param decodedToken the jwt of the request
   * @param pseudonym the proband ID
   * @param bloodSample the blood sample data
   */
  public static async createOneBloodSample(
    decodedToken: AccessToken,
    pseudonym: string,
    bloodSample: BloodSample
  ): Promise<BloodSample> {
    await this.assertProfessionalHasAccessToProband(
      pseudonym,
      decodedToken.studies
    );

    const proband = (await postgresqlHelper.getUser(pseudonym).catch((err) => {
      console.error(err);
      throw Boom.notFound('Proband not found');
    })) as User;
    if (proband.status !== 'active') {
      throw Boom.forbidden(
        'Cannot create a blood sample if proband is not active'
      );
    }
    const oldResults = (await postgresqlHelper.getBloodSamplesBySampleId(
      bloodSample.sample_id
    )) as BloodSample[];
    const bloodSampleAlreadyCarriedOut = oldResults.some(
      (oldResult) =>
        oldResult.blood_sample_carried_out === true ||
        oldResult.user_id === pseudonym
    );
    if (bloodSampleAlreadyCarriedOut) {
      throw Boom.conflict('Blood sample with this id already carried out.');
    }
    return (await postgresqlHelper
      .createBloodSample(pseudonym, bloodSample)
      .catch((err) => {
        console.error(err);
        throw Boom.conflict('sample with this id exists already');
      })) as BloodSample;
  }

  /**
   * updates a blood sample
   * @param decodedToken the jwt of the request
   * @param pseudonym the user ID
   * @param sample_id sample ID
   * @param bloodSample the new blood sample data
   */
  public static async updateOneBloodSample(
    decodedToken: AccessToken,
    pseudonym: string,
    sample_id: string,
    bloodSample: Partial<
      Pick<BloodSample, 'remark' | 'blood_sample_carried_out'>
    >
  ): Promise<BloodSample> {
    await this.assertProfessionalHasAccessToProband(
      pseudonym,
      decodedToken.studies
    );

    const proband = (await postgresqlHelper.getUser(pseudonym)) as User;
    if (proband.status !== 'active') {
      throw Boom.forbidden(
        'Cannot update a blood sample if proband is not active'
      );
    }

    if (bloodSample.remark !== undefined) {
      return (await postgresqlHelper
        .updateBloodSampleAsUT(pseudonym, sample_id, bloodSample.remark)
        .catch((err) => {
          if (
            err instanceof QueryResultError &&
            err.code === queryResultErrorCode.noData
          ) {
            throw Boom.conflict('blood sample does not exist');
          }
          throw err;
        })) as BloodSample;
    } else if (bloodSample.blood_sample_carried_out !== undefined) {
      if (bloodSample.blood_sample_carried_out === true) {
        const oldResults = (await postgresqlHelper.getBloodSamplesBySampleId(
          sample_id
        )) as BloodSample[];
        const bloodSampleAlreadyCarriedOut = oldResults.some(
          (oldResult) => oldResult.blood_sample_carried_out === true
        );

        if (bloodSampleAlreadyCarriedOut) {
          throw Boom.conflict(
            'Blood sample with this id already carried out for other proband.'
          );
        }
      }

      return (await postgresqlHelper
        .updateStatusAsUT(
          pseudonym,
          sample_id,
          bloodSample.blood_sample_carried_out
        )
        .catch((err) => {
          if (
            err instanceof QueryResultError &&
            err.code === queryResultErrorCode.noData
          ) {
            throw Boom.conflict('blood sample does not exist');
          }
          throw err;
        })) as BloodSample;
    } else {
      throw Boom.forbidden('nothing to do');
    }
  }

  private static async assertProfessionalHasAccessToProband(
    pseudonym: string,
    studyAccessOfProfessional: string[]
  ): Promise<void> {
    const studyOfProband = await userserviceClient.getStudyOfProband(pseudonym);
    if (
      !studyOfProband ||
      !studyAccessOfProfessional.includes(studyOfProband)
    ) {
      throw Boom.notFound('Proband not found');
    }
  }
}
