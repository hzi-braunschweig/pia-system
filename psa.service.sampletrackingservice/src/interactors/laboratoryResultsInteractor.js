/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');
const postgresqlHelper = require('../services/postgresqlHelper');
const { LabResultImportHelper } = require('../services/labResultImportHelper');
const complianceserviceClient = require('../clients/complianceserviceClient');
const userserviceClient = require('../clients/userserviceClient');

const laboratoryResultsInteractor = (function () {
  async function getAllLaboratoryResults(decodedToken, user_id) {
    const requesterRole = decodedToken.role;
    const requesterName = decodedToken.username;

    switch (requesterRole) {
      case 'SysAdmin':
        return Boom.forbidden('Wrong role for this command');

      case 'Proband':
        try {
          if (requesterName === user_id) {
            const { name: studyName } = await userserviceClient.getPrimaryStudy(
              user_id
            );
            const hasLabresultsCompliance =
              await complianceserviceClient.hasAgreedToCompliance(
                user_id,
                studyName,
                'labresults'
              );
            if (hasLabresultsCompliance) {
              const labResults =
                await postgresqlHelper.getAllLabResultsForProband(user_id);
              const fakeLabResult = await getFakeLabResultForTeststudie(
                user_id
              );
              if (fakeLabResult) {
                labResults.unshift(fakeLabResult);
              }
              return labResults;
            } else {
              return Boom.forbidden(
                'Proband has not complied to see lab results'
              );
            }
          } else {
            return Boom.forbidden(
              'Probands can only get labresults for themself'
            );
          }
        } catch (err) {
          console.log(err);
        }
        return Boom.internal('An internal Error happened');

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
            return await postgresqlHelper.getAllLabResultsByProband(user_id);
          } else {
            return Boom.notFound('User not found in any of your studies');
          }
        } catch (err) {
          console.log(err);
        }
        return Boom.internal('An internal Error happened');

      default:
        return Boom.forbidden('unknown role for this command');
    }
  }

  async function getOneLaboratoryResult(decodedToken, user_id, result_id) {
    const requesterRole = decodedToken.role;
    const requesterName = decodedToken.username;

    switch (requesterRole) {
      case 'SysAdmin':
      case 'Untersuchungsteam':
      case 'ProbandenManager':
        return Boom.forbidden('Wrong role for this command');

      case 'Forscher':
        try {
          const probandAccesses =
            await postgresqlHelper.getStudyAccessesByUsername(user_id);
          const pmAccesses =
            await postgresqlHelper.getStudyAccessByStudyIDsAndUsername(
              requesterName,
              probandAccesses.map((access) => access.study_id)
            );
          if (pmAccesses.length > 0) {
            const labResult = await postgresqlHelper.getLabResult(
              user_id,
              result_id
            );
            if (labResult) {
              return labResult;
            } else {
              return Boom.notFound('Could not find labresults');
            }
          } else {
            return Boom.forbidden(
              'Forscher/PM is not in the same study as proband'
            );
          }
        } catch (err) {
          console.log(err);
          return Boom.internal('An internal Error happened');
        }

      case 'Proband':
        try {
          if (requesterName === user_id) {
            const { name: studyName } = await userserviceClient.getPrimaryStudy(
              user_id
            );
            const hasLabresultsCompliance =
              await complianceserviceClient.hasAgreedToCompliance(
                user_id,
                studyName,
                'labresults'
              );
            if (hasLabresultsCompliance) {
              const labResult = await postgresqlHelper.getLabResultForProband(
                user_id,
                result_id
              );
              if (labResult) {
                return labResult;
              } else {
                const fakeLabResult = await getFakeLabResultForTeststudie(
                  user_id
                );
                if (fakeLabResult) {
                  return fakeLabResult;
                } else {
                  return Boom.notFound('Could not find labresults');
                }
              }
            } else {
              return Boom.forbidden(
                'Proband has not complied to see lab results'
              );
            }
          } else {
            return Boom.forbidden(
              'Probands can only get labresults for themself'
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

  async function getLaboratoryResultWithSampleID(decodedToken, sample_id) {
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
          const labResult = await postgresqlHelper.getLabResultForAllProbands(
            sample_id
          );
          const PMAccesses = await postgresqlHelper.getStudyAccessesByUsername(
            requesterName
          );
          const filteredlabResults = [];
          if (labResult && PMAccesses) {
            return postgresqlHelper
              .getStudyAccessesByUsername(labResult.user_id)
              .then(function (probandAccesses) {
                PMAccesses.some(function (PMAccess) {
                  return probandAccesses.some(function (probandAccess) {
                    if (PMAccess.study_id === probandAccess.study_id) {
                      filteredlabResults.push(labResult);
                      return true;
                    }
                    return false;
                  });
                });
                if (filteredlabResults.length === 0) {
                  return Boom.forbidden('PM has no access');
                } else {
                  return filteredlabResults;
                }
              })
              .catch((err) => {
                console.log(err);
                return Boom.forbidden(
                  'Proband is not in the study or proband was deleted'
                );
              });
          } else {
            return Boom.forbidden(
              "Laboratory sample doesn't exist or PM has no access"
            );
          }
        } catch (err) {
          console.log(err);
          return Boom.internal('An internal Error happened');
        }
      default:
        return Boom.forbidden('unknown role for this command');
    }
  }

  async function postLabResultsImport(decodedToken) {
    const requesterRole = decodedToken.role;

    switch (requesterRole) {
      case 'SysAdmin':
      case 'Untersuchungsteam':
      case 'Proband':
      case 'Forscher':
        return Boom.forbidden('Wrong role for this command');

      case 'ProbandenManager':
        try {
          const results = await Promise.all([
            LabResultImportHelper.importHl7FromMhhSftp(),
            LabResultImportHelper.importCsvFromHziSftp(),
          ]);
          return results.every((result) => result === 'success')
            ? 'success'
            : 'error';
        } catch (err) {
          console.log(err);
        }
        return Boom.internal('An internal Error happened');

      default:
        return Boom.forbidden('unknown role for this command');
    }
  }

  async function createOneLaboratoryResult(decodedToken, user_id, labResult) {
    const requesterRole = decodedToken.role;
    const requesterName = decodedToken.username;

    switch (requesterRole) {
      case 'SysAdmin':
      case 'Proband':
      case 'Forscher':
        return Boom.forbidden('Wrong role for this command');

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
          const proband = await postgresqlHelper.getUser(user_id);
          if (
            pmAccesses.length > 0 &&
            proband &&
            proband.account_status !== 'deleted' &&
            proband.account_status !== 'deactivated'
          ) {
            try {
              return await postgresqlHelper.createLabResult(user_id, labResult);
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

  async function updateOneLaboratoryResult(
    decodedToken,
    user_id,
    result_id,
    labResult
  ) {
    const requesterRole = decodedToken.role;
    const requesterName = decodedToken.username;

    switch (requesterRole) {
      case 'SysAdmin':
      case 'Forscher':
        return Boom.forbidden('Wrong role for this command');

      case 'Untersuchungsteam':
      case 'ProbandenManager':
        try {
          const probandAccesses =
            await postgresqlHelper.getStudyAccessesByUsername(user_id);
          const oldLabResult = await postgresqlHelper.getLabResult(
            user_id,
            result_id
          );
          const pmAccesses =
            await postgresqlHelper.getStudyAccessByStudyIDsAndUsername(
              requesterName,
              probandAccesses.map((access) => access.study_id)
            );
          const proband = await postgresqlHelper.getUser(user_id);
          if (
            proband &&
            proband.account_status !== 'deleted' &&
            proband.account_status !== 'deactivated'
          ) {
            if (
              pmAccesses.length > 0 &&
              oldLabResult &&
              labResult.remark &&
              labResult.new_samples_sent !== undefined &&
              oldLabResult.study_status !== 'deleted'
            ) {
              return await postgresqlHelper.updateLabResultAsPM(
                user_id,
                result_id,
                labResult
              );
            } else if (
              pmAccesses.length > 0 &&
              oldLabResult &&
              labResult.status !== undefined &&
              oldLabResult.study_status !== 'deleted' &&
              proband.account_status !== 'deactivated'
            ) {
              return await postgresqlHelper.updateStatusAsPM(
                user_id,
                result_id,
                labResult.status
              );
            } else {
              return Boom.forbidden(
                'PM is not in the same study as proband or Labresult does not exist or update params are missing'
              );
            }
          } else {
            return Boom.forbidden('Proband was deleted');
          }
        } catch (err) {
          console.log(err);
        }
        return Boom.internal('An internal Error happened');

      case 'Proband':
        try {
          const oldLabResult = await postgresqlHelper.getLabResult(
            user_id,
            result_id
          );
          if (oldLabResult) {
            if (
              (labResult.dummy_sample_id &&
                oldLabResult.dummy_sample_id &&
                oldLabResult.dummy_sample_id ===
                  labResult.dummy_sample_id.toUpperCase()) ||
              (!oldLabResult.dummy_sample_id && !oldLabResult.labResult)
            ) {
              if (
                requesterName === user_id &&
                oldLabResult &&
                labResult.date_of_sampling &&
                (oldLabResult.status === 'new' ||
                  oldLabResult.status === 'inactive') &&
                oldLabResult.study_status !== 'deleted' &&
                oldLabResult.study_status !== 'deactivated'
              ) {
                const { name: studyName } =
                  await userserviceClient.getPrimaryStudy(user_id);
                const hasSamplesCompliance =
                  await complianceserviceClient.hasAgreedToCompliance(
                    user_id,
                    studyName,
                    'samples'
                  );
                if (hasSamplesCompliance) {
                  return await postgresqlHelper.updateLabResultAsProband(
                    user_id,
                    result_id,
                    labResult
                  );
                } else {
                  return Boom.forbidden(
                    'Proband has not complied to take samples'
                  );
                }
              } else {
                return Boom.forbidden(
                  'Sample_id does not belong to Proband or it does not exist in db or update params are missing'
                );
              }
            } else {
              return Boom.forbidden(
                'Dummy_sample_id does not match the one in the database'
              );
            }
          } else {
            return Boom.forbidden('Labresult does not exist');
          }
        } catch (err) {
          console.log(err);
        }
        return Boom.internal('An internal Error happened');

      default:
        return Boom.forbidden('unknown role for this command');
    }
  }

  async function getFakeLabResultForTeststudie(user_id) {
    const probandAccesses = await postgresqlHelper.getStudyAccessesByUsername(
      user_id
    );
    const isProbandOfTeststudie = probandAccesses.some(
      (access) => access.study_id === 'Teststudie'
    );
    if (isProbandOfTeststudie) {
      return createTestStudieFakeLabResult(user_id);
    } else {
      return null;
    }
  }

  function createTestStudieFakeLabResult(user_id) {
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
          date_of_analysis: new Date('2020-06-03T11:45').toISOString(),
          date_of_delivery: new Date('2020-06-01T19:35').toISOString(),
          date_of_announcement: new Date('2020-06-04T09:00').toISOString(),
          lab_name: 'MHH',
          material: 'Nasenabstrich',
          result_string: 'negativ',
          unit: 'AU/ml',
          other_unit: '.',
          kit_name: 'LIAISON SARS-CoV-2 S1/S2 IgG-Assay (Diasorin)',
        },
      ],
    };
  }

  return {
    /**
     * @function
     * @description gets all laboratory results for a user
     * @memberof module:laboratoryResultsInteractor
     * @param {string} decodedToken the jwt of the request
     * @param {string} user_id the user ID
     * @param {string} study_name the study ID
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getAllLaboratoryResults: getAllLaboratoryResults,

    /**
     * @function
     * @description gets one laboratory result for a user
     * @memberof module:laboratoryResultsInteractor
     * @param {string} decodedToken the jwt of the request
     * @param {string} user_id the user ID
     * @param {string} result_id the result ID
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getOneLaboratoryResult: getOneLaboratoryResult,

    /**
     * @function
     * @description gets one laboratory result based on the sample ID
     * @memberof module:laboratoryResultsInteractor
     * @param {string} decodedToken the jwt of the request
     * @param {string} sample_id the sample ID
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getLaboratoryResultWithSampleID: getLaboratoryResultWithSampleID,

    /**
     * @function
     * @description performs an export for the laboratory results
     * @memberof module:laboratoryResultsInteractor
     * @param {string} decodedToken the jwt of the request
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    postLabResultsImport: postLabResultsImport,

    /**
     * @function
     * @description creates one laboratory result
     * @memberof module:laboratoryResultsInteractor
     * @param {string} decodedToken the jwt of the request
     * @param {string} user_id the user ID
     * @param {object} the laboratory result data
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    createOneLaboratoryResult: createOneLaboratoryResult,

    /**
     * @function
     * @description updates one laboratory result
     * @memberof module:laboratoryResultsInteractor
     * @param {string} decodedToken the jwt of the request
     * @param {string} user_id the user ID
     * @param {string} result_id the result ID
     * @param {object} the laboratory result data
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    updateOneLaboratoryResult: updateOneLaboratoryResult,
  };
})();

module.exports = laboratoryResultsInteractor;
