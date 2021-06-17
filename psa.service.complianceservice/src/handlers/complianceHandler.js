const Boom = require('@hapi/boom');
const complianceInteractor = require('../interactors/complianceInteractor');

/**
 * This class is responsible for handling requests regarding the compliance a user has given
 */
class ComplianceHandler {
  static async getComplianceAgree(request) {
    const userRole = request.auth.credentials.role;

    if (userRole === 'Proband') {
      if (request.params.userId !== request.auth.credentials.username) {
        return Boom.forbidden(
          'Probands can only fetch own compliance requirements'
        );
      } else {
        return complianceInteractor.getComplianceAgree(
          request,
          request.params.study,
          request.params.userId
        );
      }
    } else if (userRole === 'Untersuchungsteam') {
      return ComplianceHandler.mapToComplianceAgreeWithoutData(
        await complianceInteractor.getComplianceAgree(
          request,
          request.params.study,
          request.params.userId
        )
      );
    } else {
      return Boom.forbidden('Wrong role for this command');
    }
  }

  static async getComplianceAgreeById(request) {
    const userRole = request.auth.credentials.role;
    const userStudies = request.auth.credentials.groups;
    const study = request.params.study;

    if (!userStudies.includes(study)) {
      return Boom.unauthorized(
        'You are not authorized to access this compliance'
      );
    }

    if (userRole === 'EinwilligungsManager') {
      return await complianceInteractor.getComplianceAgreeByComplianceId(
        request.params.id,
        study
      );
    } else {
      return Boom.forbidden('Wrong role for this command');
    }
  }

  static getCompliancesForProfessional(request) {
    const userRole = request.auth.credentials.role;
    const userStudies = request.auth.credentials.groups;

    if (userRole === 'EinwilligungsManager') {
      return complianceInteractor.getCompliancesForProfessional(
        request,
        userStudies
      );
    } else {
      return Boom.forbidden('Wrong role for this command');
    }
  }

  static postComplianceAgree(request) {
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
      if (request.params.userId !== request.auth.credentials.username) {
        return Boom.forbidden('Probands can only save own compliance');
      } else {
        return complianceInteractor.createComplianceAgree(
          request,
          request.params.study,
          request.params.userId,
          request.payload
        );
      }
    } else if (userRole === 'Untersuchungsteam') {
      return complianceInteractor.createComplianceAgree(
        request,
        request.params.study,
        request.params.userId,
        request.payload
      );
    } else {
      return Boom.forbidden('Wrong role for this command');
    }
  }

  /**
   * @private
   */
  static async _createPdfResponse(request, h) {
    const response = h.response(
      await complianceInteractor.getComplianceAgreePdf(
        request,
        request.params.study,
        request.params.userId
      )
    );
    response.header('Content-Type', 'application/pdf');
    response.header('Content-Disposition', 'attachment; filename=consent.pdf');
    return response;
  }

  static async _createPdfResponseByComplianceId(request, h) {
    const study = request.params.study;
    const response = h.response(
      await complianceInteractor.getComplianceAgreePdfByComplianceId(
        request,
        request.params.id,
        study
      )
    );
    response.header('Content-Type', 'application/pdf');
    response.header('Content-Disposition', 'attachment; filename=consent.pdf');
    return response;
  }

  static async getComplianceAgreePdf(request, h) {
    const userRole = request.auth.credentials.role;
    const userStudies = request.auth.credentials.groups;
    const study = request.params.study;

    if (!userStudies.includes(study)) {
      return Boom.unauthorized(
        'You are not authorized to access this compliance'
      );
    }

    if (userRole === 'Proband') {
      if (request.params.userId !== request.auth.credentials.username) {
        return Boom.forbidden(
          'Probands can only fetch own compliance requirements'
        );
      } else {
        return await ComplianceHandler._createPdfResponse(request, h);
      }
    } else {
      return Boom.forbidden('Wrong role for this command');
    }
  }

  static async getComplianceAgreePdfByComplianceId(request, h) {
    const userRole = request.auth.credentials.role;
    const userStudies = request.auth.credentials.groups;
    const study = request.params.study;

    if (!userStudies.includes(study)) {
      return Boom.unauthorized(
        'You are not authorized to access this compliance'
      );
    }

    if (userRole === 'EinwilligungsManager') {
      return await ComplianceHandler._createPdfResponseByComplianceId(
        request,
        h
      );
    } else {
      return Boom.forbidden('Wrong role for this command');
    }
  }

  static getComplianceAgreeNeeded(request) {
    const userRole = request.auth.credentials.role;
    request.app.locale = request.auth.credentials.locale;

    if (userRole === 'Proband') {
      if (request.params.userId !== request.auth.credentials.username) {
        return Boom.forbidden(
          'Probands can only fetch own compliance requirements'
        );
      } else {
        return complianceInteractor.getComplianceAgreeNeeded(
          request,
          request.params.study,
          request.params.userId
        );
      }
    } else {
      return Boom.forbidden('Wrong role for this command');
    }
  }

  /**
   * Removes all filled out data from the compliance agree
   * @param {ComplianceRes} complianceAgree
   * @returns {ComplianceRes}
   */
  static mapToComplianceAgreeWithoutData(complianceAgree) {
    if (complianceAgree) {
      return {
        compliance_text_object: complianceAgree.compliance_text_object,
        compliance_text: complianceAgree.compliance_text,
        textfields: null,
        compliance_system: null,
        compliance_questionnaire: null,
        timestamp: complianceAgree.timestamp,
      };
    } else {
      return complianceAgree;
    }
  }
}

module.exports = ComplianceHandler;
