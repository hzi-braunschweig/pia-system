/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');
const { ComplianceService } = require('../../services/complianceService');

/**
 * @enum {string}
 */
const SystemComplianceTypes = {
  APP: 'app',
  SAMPLES: 'samples',
  BLOODSAMPLES: 'bloodsamples',
  LABRESULTS: 'labresults',
};

class InternalComplianceInteractor {
  /**
   * Checks for all compliance in the given array, whether there is an unfulfilled compliance.
   * If not, everything is okay and it returns true, even if the array is empty.
   * @param {import('@hapi/hapi').Request} request the request
   * @param study {string}
   * @param userId {string}
   * @param systemCompliances {SystemComplianceTypes[]}
   * @param genericCompliances {string[]}
   * @return {Promise<boolean>}
   */
  static async hasComplianceAgree(
    request,
    study,
    userId,
    systemCompliances,
    genericCompliances
  ) {
    if (!systemCompliances && !genericCompliances) {
      return true;
    }
    let agree;
    try {
      agree = await ComplianceService.getComplianceAgree(
        request,
        study,
        userId
      );
    } catch (e) {
      request.log('error', e.stack + JSON.stringify(e, null, 2));
      throw Boom.boomify(e);
    }
    if (!agree) {
      return false;
    }
    if (Array.isArray(systemCompliances)) {
      for (const systemCompliance of systemCompliances) {
        switch (systemCompliance) {
          case SystemComplianceTypes.APP:
            if (!agree.compliance_system.app) {
              return false;
            }
            break;
          case SystemComplianceTypes.SAMPLES:
            if (!agree.compliance_system.samples) {
              return false;
            }
            break;
          case SystemComplianceTypes.BLOODSAMPLES:
            if (!agree.compliance_system.bloodsamples) {
              return false;
            }
            break;
          case SystemComplianceTypes.LABRESULTS:
            if (!agree.compliance_system.labresults) {
              return false;
            }
            break;
        }
      }
    }
    if (Array.isArray(genericCompliances)) {
      for (const genericCompliance of genericCompliances) {
        if (
          !agree.compliance_questionnaire.some(
            (compliance) =>
              compliance.name === genericCompliance && compliance.value === true
          )
        ) {
          return false;
        }
      }
    }
    return true;
  }
}

module.exports = InternalComplianceInteractor;
