const Boom = require('@hapi/boom');
const complianceTextInteractor = require('../interactors/complianceTextInteractor');

/**
 * This class is responsible for handling requests regarding the compliance text
 */
class ComplianceTextHandler {
  static async getComplianceText(request) {
    const userRole = request.auth.credentials.role;
    const userStudies = request.auth.credentials.groups;
    const study = request.params.study;
    request.app.locale = request.auth.credentials.locale;

    if (!userStudies.includes(study)) {
      return Boom.unauthorized(
        'You are not authorized to access this compliance'
      );
    }

    if (userRole === 'Proband' || userRole === 'Untersuchungsteam') {
      return await complianceTextInteractor.getComplianceTextForAgree(
        request,
        request.params.study,
        userRole
      );
    } else {
      return Boom.forbidden('Wrong role for this command');
    }
  }

  static async getComplianceTextEdit(request) {
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
      return await complianceTextInteractor.getComplianceTextForEdit(
        request,
        request.params.study
      );
    } else {
      return Boom.forbidden('Wrong role for this command');
    }
  }

  static putComplianceText(request) {
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
      return complianceTextInteractor.updateComplianceText(
        request,
        request.params.study,
        request.payload
      );
    } else {
      return Boom.forbidden('Wrong role for this command');
    }
  }

  static postComplianceTextPreview(request) {
    const userRole = request.auth.credentials.role;
    request.app.locale = request.auth.credentials.locale;

    if (userRole === 'Forscher') {
      return complianceTextInteractor.previewComplianceText(
        request,
        request.payload.compliance_text
      );
    } else {
      return Boom.forbidden('Wrong role for this command');
    }
  }

  static async getInternalComplianceActive(request) {
    const userRole = request.auth.credentials.role;
    const userStudies = request.auth.credentials.groups;
    const study = request.params.study;
    request.app.locale = request.auth.credentials.locale;

    if (!userStudies.includes(study)) {
      return Boom.unauthorized(
        'You are not authorized to access this compliance'
      );
    }

    if (userRole === 'Proband') {
      return await complianceTextInteractor.isInternalComplianceActive(
        request,
        request.params.study
      );
    } else {
      return Boom.forbidden('Wrong role for this command');
    }
  }
}

module.exports = ComplianceTextHandler;
