/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';

import complianceInteractor from '../interactors/complianceInteractor';
import {
  Lifecycle,
  ResponseObject,
  ResponseToolkit,
  Request,
} from '@hapi/hapi';
import { AccessToken, hasRealmRole } from '@pia/lib-service-core';
import { ComplianceReq, ComplianceRes } from '../model/compliance';
import { withAppLocale } from '../utils/requestAppLocale';

/**
 * This class is responsible for handling requests regarding the compliance a user has given
 */
export class ComplianceHandler {
  public static getComplianceAgree: Lifecycle.Method = async (request) => {
    if (hasRealmRole('Proband', request.auth.credentials)) {
      this.assertRequestedPseudonymMatchesUsername(request);

      return complianceInteractor.getComplianceAgree(
        request,
        request.params['studyName'] as string,
        request.params['pseudonym'] as string
      );
    } else if (hasRealmRole('Untersuchungsteam', request.auth.credentials)) {
      return ComplianceHandler.mapToComplianceAgreeWithoutData(
        await complianceInteractor.getComplianceAgree(
          request,
          request.params['studyName'] as string,
          request.params['pseudonym'] as string
        )
      );
    } else {
      throw Boom.forbidden('Wrong role for this command');
    }
  };

  public static getComplianceAgreeById: Lifecycle.Method = async (request) => {
    return await complianceInteractor.getComplianceAgreeByComplianceId(
      request.params['id'],
      request.params['studyName'] as string
    );
  };

  public static getCompliancesForProfessional: Lifecycle.Method = async (
    request
  ) => {
    const { studies } = request.auth.credentials as AccessToken;

    return complianceInteractor.getCompliancesForProfessional(request, studies);
  };

  public static postComplianceAgree: Lifecycle.Method = async (request) => {
    const decodedToken = request.auth.credentials as AccessToken;

    if (hasRealmRole('Proband', decodedToken)) {
      this.assertRequestedPseudonymMatchesUsername(request);
    }

    return complianceInteractor.createComplianceAgree(
      withAppLocale(request),
      request.params['studyName'] as string,
      request.params['pseudonym'] as string,
      request.payload as ComplianceReq
    );
  };

  public static getComplianceAgreePdf: Lifecycle.Method = async (
    request,
    h
  ) => {
    this.assertRequestedPseudonymMatchesUsername(request);

    const pdfBuffer = await complianceInteractor.getComplianceAgreePdf(
      request,
      request.params['studyName'] as string,
      request.params['pseudonym'] as string
    );
    return ComplianceHandler._createPdfResponse(pdfBuffer, h);
  };

  public static getComplianceAgreePdfByComplianceId: Lifecycle.Method = async (
    request,
    h
  ) => {
    const pdfBuffer =
      await complianceInteractor.getComplianceAgreePdfByComplianceId(
        request,
        request.params['id'] as number,
        request.params['studyName'] as string
      );
    return ComplianceHandler._createPdfResponse(pdfBuffer, h);
  };

  public static getComplianceAgreeNeeded: Lifecycle.Method = async (
    request
  ) => {
    this.assertRequestedPseudonymMatchesUsername(request);

    return complianceInteractor.getComplianceAgreeNeeded(
      withAppLocale(request),
      request.params['studyName'] as string,
      request.params['pseudonym'] as string
    );
  };

  private static assertRequestedPseudonymMatchesUsername(
    request: Request
  ): void {
    if (request.params['pseudonym'] !== request.auth.credentials['username']) {
      throw Boom.forbidden('Probands can only access own compliances');
    }
  }

  /**
   * Removes all filled out data from the compliance agree
   */
  private static mapToComplianceAgreeWithoutData(
    complianceAgree?: ComplianceRes
  ): ComplianceRes | undefined {
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

  private static _createPdfResponse(
    pdfBuffer: Buffer,
    h: ResponseToolkit
  ): ResponseObject {
    const response = h.response(pdfBuffer);
    response.header('Content-Type', 'application/pdf');
    response.header('Content-Disposition', 'attachment; filename=consent.pdf');
    return response;
  }
}
