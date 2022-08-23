/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';
import { getPrimaryRealmRole } from '@pia/lib-service-core';

import complianceTextInteractor from '../interactors/complianceTextInteractor';
import { ComplianceText } from '../model/complianceText';
import { withAppLocale } from '../utils/requestAppLocale';

/**
 * This class is responsible for handling requests regarding the compliance text
 */
export class ComplianceTextHandler {
  public static getComplianceText: Lifecycle.Method = async (request) => {
    return complianceTextInteractor.getComplianceTextForAgree(
      withAppLocale(request),
      request.params['studyName'] as string,
      getPrimaryRealmRole(request.auth.credentials)
    );
  };

  public static getComplianceTextEdit: Lifecycle.Method = async (request) => {
    return complianceTextInteractor.getComplianceTextForEdit(
      withAppLocale(request),
      request.params['studyName'] as string
    );
  };

  public static putComplianceText: Lifecycle.Method = async (request) => {
    return complianceTextInteractor.updateComplianceText(
      withAppLocale(request),
      request.params['studyName'] as string,
      request.payload as ComplianceText
    );
  };

  public static postComplianceTextPreview: Lifecycle.Method = (request) => {
    return complianceTextInteractor.previewComplianceText(
      withAppLocale(request),
      (request.payload as { compliance_text: string }).compliance_text
    );
  };

  public static getInternalComplianceActive: Lifecycle.Method = async (
    request
  ) => {
    return complianceTextInteractor.isInternalComplianceActive(
      withAppLocale(request),
      request.params['studyName'] as string
    );
  };
}
