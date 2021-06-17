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
