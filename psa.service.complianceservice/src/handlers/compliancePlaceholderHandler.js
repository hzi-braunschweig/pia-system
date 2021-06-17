const Boom = require('@hapi/boom');
const compliancePlaceholderInteractor = require('../interactors/compliancePlaceholderInteractor');

/**
 * This class is responsible for handling requests regarding the placeholders for a compliance text
 */
class CompliancePlaceholderHandler {
  static getComplianceQuestionnairePlaceholders(request) {
    const userRole = request.auth.credentials.role;
    const userStudies = request.auth.credentials.groups;
    const study = request.params.study;
    request.app.locale = request.auth.credentials.locale;

    if (!userStudies.includes(study)) {
      return Boom.unauthorized(
        'You are not authorized to access this compliance'
      );
    }

    if (userRole === 'Forscher') {
      return compliancePlaceholderInteractor.getComplianceQuestionnairePlaceholders(
        request,
        request.params.study
      );
    } else {
      return Boom.forbidden('Wrong role for this command');
    }
  }

  static postComplianceQuestionnairePlaceholder(request) {
    const userRole = request.auth.credentials.role;
    const userStudies = request.auth.credentials.groups;
    const study = request.params.study;
    request.app.locale = request.auth.credentials.locale;

    if (!userStudies.includes(study)) {
      return Boom.unauthorized(
        'You are not authorized to access this compliance'
      );
    }

    if (userRole === 'Forscher') {
      return compliancePlaceholderInteractor.createNewComplianceQuestionnairePlaceholder(
        request,
        request.params.study,
        request.payload
      );
    } else {
      return Boom.forbidden('Wrong role for this command');
    }
  }
}

module.exports = CompliancePlaceholderHandler;
