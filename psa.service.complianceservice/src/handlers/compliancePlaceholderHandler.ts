/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';

import compliancePlaceholderInteractor from '../interactors/compliancePlaceholderInteractor';
import { GenericFieldDescription } from '../model/compliancePlaceholder';
import { withAppLocale } from '../utils/requestAppLocale';

/**
 * This class is responsible for handling requests regarding the placeholders for a compliance text
 */
export class CompliancePlaceholderHandler {
  public static getComplianceQuestionnairePlaceholders: Lifecycle.Method =
    async (request) => {
      return compliancePlaceholderInteractor.getComplianceQuestionnairePlaceholders(
        withAppLocale(request),
        request.params['studyName'] as string
      );
    };

  public static postComplianceQuestionnairePlaceholder: Lifecycle.Method =
    async (request) => {
      return compliancePlaceholderInteractor.createNewComplianceQuestionnairePlaceholder(
        withAppLocale(request),
        request.params['studyName'] as string,
        request.payload as GenericFieldDescription
      );
    };
}
