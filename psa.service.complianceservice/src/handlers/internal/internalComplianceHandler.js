/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const internalComplianceInteractor = require('../../interactors/internal/internalComplianceInteractor');

/**
 * This class is responsible for handling requests regarding the compliance a user has given
 */
class InternalComplianceHandler {
  static hasComplianceAgree(request) {
    return internalComplianceInteractor.hasComplianceAgree(
      request,
      request.params.study,
      request.params.userId,
      request.query.system,
      request.query.generic
    );
  }
}

module.exports = InternalComplianceHandler;
