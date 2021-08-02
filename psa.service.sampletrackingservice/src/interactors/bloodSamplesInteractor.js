/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');

const postgresqlHelper = require('../services/postgresqlHelper');

const bloodSamplesInteractor = (function () {
  async function getAllBloodSamples(decodedToken, user_id) {
    const requesterRole = decodedToken.role;
    const requesterName = decodedToken.username;

    switch (requesterRole) {
      case 'Proband':
      case 'SysAdmin':
        return Boom.forbidden('Wrong role for this command');

      case 'Forscher':
      case 'Untersuchungsteam':
      case 'ProbandenManager':
        try {
          const probandAccesses =
            await postgresqlHelper.getStudyAccessesByUsername(user_id);
          const pmAccesses =
            await postgresqlHelper.getStudyAccessByStudyIDsAndUsername(
              requesterName,
              probandAccesses.map((access) => access.study_id)
            );
          if (pmAccesses.length > 0) {
            return await postgresqlHelper.getAllBloodSamplesForProband(user_id);
          }
          return Boom.notFound('User not found in any of your studies');
        } catch (err) {
          console.log(err);
        }
        return Boom.internal('An internal Error happened');

      default:
        return Boom.forbidden('unknown role for this command');
    }
  }

  async function getOneBloodSample(decodedToken, user_id, sample_id) {
    const requesterRole = decodedToken.role;
    const requesterName = decodedToken.username;

    switch (requesterRole) {
      case 'SysAdmin':
      case 'Proband':
        return Boom.forbidden('Wrong role for this command');

      case 'Forscher':
      case 'Untersuchungsteam':
      case 'ProbandenManager':
        try {
          const probandAccesses =
            await postgresqlHelper.getStudyAccessesByUsername(user_id);
          const pmAccesses =
            await postgresqlHelper.getStudyAccessByStudyIDsAndUsername(
              requesterName,
              probandAccesses.map((access) => access.study_id)
            );
          if (pmAccesses.length > 0) {
            return await postgresqlHelper.getBloodSample(user_id, sample_id);
          } else {
            return Boom.notFound('User not found in any of your studies');
          }
        } catch (err) {
          console.log(err);
          return Boom.internal('An internal Error happened');
        }

      default:
        return Boom.forbidden('unknown role for this command');
    }
  }

  async function getBloodSampleWithSampleID(decodedToken, sample_id) {
    const requesterRole = decodedToken.role;
    const requesterName = decodedToken.username;
    switch (requesterRole) {
      case 'SysAdmin':
      case 'Proband':
      case 'Forscher':
      case 'Untersuchungsteam':
        return Boom.forbidden('Wrong role for this command');

      case 'ProbandenManager':
        try {
          const bloodSamples =
            await postgresqlHelper.getBloodSampleForAllProbands(sample_id);
          const PMAccesses = await postgresqlHelper.getStudyAccessesByUsername(
            requesterName
          );
          if (bloodSamples && PMAccesses) {
            const filteredBloodSamples = [];
            const promises = bloodSamples.map(async (bloodSample) => {
              const probandAccesses = await postgresqlHelper
                .getStudyAccessesByUsername(bloodSample.user_id)
                .catch((err) => {
                  console.log(err);
                  return [];
                });

              const containSameStudy = PMAccesses.some((PMAccess) =>
                probandAccesses.some(
                  (probandAccess) =>
                    PMAccess.study_id === probandAccess.study_id
                )
              );
              if (containSameStudy) {
                filteredBloodSamples.push(bloodSample);
              }
            });
            await Promise.all(promises).catch((err) => {
              console.log(err);
              return Boom.internal('An internal Error happened');
            });
            if (filteredBloodSamples.length === 0) {
              return Boom.notFound('User not found in any of your studies');
            } else {
              return filteredBloodSamples;
            }
          } else {
            return Boom.notFound('User not found in any of your studies');
          }
        } catch (err) {
          console.log(err);
          return Boom.internal('An internal Error happened');
        }
      default:
        return Boom.forbidden('unknown role for this command');
    }
  }

  async function createOneBloodSample(decodedToken, user_id, bloodSample) {
    const requesterRole = decodedToken.role;
    const requesterName = decodedToken.username;

    switch (requesterRole) {
      case 'SysAdmin':
      case 'Proband':
      case 'Forscher':
      case 'ProbandenManager':
        return Boom.forbidden('Wrong role for this command');

      case 'Untersuchungsteam':
        try {
          const probandAccesses =
            await postgresqlHelper.getStudyAccessesByUsername(user_id);
          const pmAccesses =
            await postgresqlHelper.getStudyAccessByStudyIDsAndUsername(
              requesterName,
              probandAccesses.map((access) => access.study_id)
            );
          const proband = await postgresqlHelper.getUser(user_id);
          if (
            pmAccesses.length > 0 &&
            proband &&
            proband.account_status !== 'deleted' &&
            proband.account_status !== 'deactivated'
          ) {
            try {
              let bloodSampleAlreadyCarriedOut = false;
              const oldResults =
                await postgresqlHelper.getBloodSampleForAllProbands(
                  bloodSample.sample_id
                );
              oldResults.forEach(function (oldResult) {
                if (
                  oldResult &&
                  (oldResult.blood_sample_carried_out === true ||
                    oldResult.user_id === user_id)
                ) {
                  bloodSampleAlreadyCarriedOut = true;
                }
              });
              if (bloodSampleAlreadyCarriedOut) {
                return Boom.conflict(
                  'Blood sample with this id already carried out.'
                );
              } else {
                return await postgresqlHelper.createBloodSample(
                  user_id,
                  bloodSample
                );
              }
            } catch (err) {
              console.log(err);
              return Boom.conflict('sample with this id exists already');
            }
          } else {
            return Boom.forbidden(
              'Requester is not in the same study as proband or proband was deleted'
            );
          }
        } catch (err) {
          console.log(err);
        }
        return Boom.internal('An internal Error happened');

      default:
        return Boom.forbidden('unknown role for this command');
    }
  }

  async function updateOneBloodSample(
    decodedToken,
    user_id,
    sample_id,
    bloodSample
  ) {
    const requesterRole = decodedToken.role;
    const requesterName = decodedToken.username;

    switch (requesterRole) {
      case 'SysAdmin':
      case 'ProbandenManager':
      case 'Forscher':
      case 'Proband':
        return Boom.forbidden('Wrong role for this command');

      case 'Untersuchungsteam':
        try {
          const probandAccesses =
            await postgresqlHelper.getStudyAccessesByUsername(user_id);
          const oldBloodSample = await postgresqlHelper.getBloodSample(
            user_id,
            sample_id
          );
          const pmAccesses =
            await postgresqlHelper.getStudyAccessByStudyIDsAndUsername(
              requesterName,
              probandAccesses.map((access) => access.study_id)
            );
          const proband = await postgresqlHelper.getUser(user_id);

          if (
            pmAccesses.length > 0 &&
            oldBloodSample &&
            bloodSample.remark &&
            proband &&
            proband.account_status !== 'deleted' &&
            proband.account_status !== 'deactivated'
          ) {
            return await postgresqlHelper.updateBloodSampleAsUT(
              user_id,
              sample_id,
              bloodSample.remark
            );
          } else if (
            pmAccesses.length > 0 &&
            oldBloodSample &&
            bloodSample.blood_sample_carried_out !== undefined &&
            proband &&
            proband.account_status !== 'deleted' &&
            proband.account_status !== 'deactivated'
          ) {
            try {
              let bloodSampleAlreadyCarriedOut = false;
              if (bloodSample.blood_sample_carried_out === true) {
                const oldResults =
                  await postgresqlHelper.getBloodSampleForAllProbands(
                    sample_id
                  );
                oldResults.forEach(function (oldResult) {
                  if (
                    oldResult &&
                    oldResult.blood_sample_carried_out === true
                  ) {
                    bloodSampleAlreadyCarriedOut = true;
                  }
                });
              }

              if (bloodSampleAlreadyCarriedOut) {
                return Boom.conflict(
                  'Blood sample with this id already carried out for other proband.'
                );
              } else {
                return await postgresqlHelper.updateStatusAsUT(
                  user_id,
                  sample_id,
                  bloodSample.blood_sample_carried_out
                );
              }
            } catch (err) {
              console.log(err);
              return Boom.conflict('sample with this id exists already');
            }
          } else {
            return Boom.forbidden(
              'UT is not in the same study as proband or blood sample does not exist or update params are missing'
            );
          }
        } catch (err) {
          console.log(err);
        }
        return Boom.internal('An internal Error happened');

      default:
        return Boom.forbidden('unknown role for this command');
    }
  }

  return {
    /**
     * @function
     * @description gets all the blood samples
     * @memberof module:bloodSamplesInteractor
     * @param {string} user_id the user ID
     * @param {string} decodedToken the jwt of the request
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getAllBloodSamples: getAllBloodSamples,

    /**
     * @function
     * @description gets one blood sample
     * @memberof module:bloodSamplesInteractor
     * @param {string} decodedToken the jwt of the request
     * @param {string} user_id the user ID
     * @param {string} sample_id sample ID
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getOneBloodSample: getOneBloodSample,

    /**
     * @function
     * @description gets one blood sample based on the sample id
     * @memberof module:bloodSamplesInteractor
     * @param {string} decodedToken the jwt of the request
     * @param {string} sample_id sample ID
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getBloodSampleWithSampleID: getBloodSampleWithSampleID,

    /**
     * @function
     * @description creates a blood sample
     * @memberof module:bloodSamplesInteractor
     * @param {string} decodedToken the jwt of the request
     * @param {string} user_id the user ID
     * @param {object} bloodSample the blood sample data
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    createOneBloodSample: createOneBloodSample,

    /**
     * @function
     * @description updates a blood sample
     * @memberof module:bloodSamplesInteractor
     * @param {string} decodedToken the jwt of the request
     * @param {string} user_id the user ID
     * @param {string} sample_id sample ID
     * @param {object} bloodSample the new blood sample data
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    updateOneBloodSample: updateOneBloodSample,
  };
})();

module.exports = bloodSamplesInteractor;
