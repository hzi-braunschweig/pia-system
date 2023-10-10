/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';
import { LabResultTemplate } from '../models/labResultTemplate';
import { badRequest } from '@hapi/boom';
import { LaboratoryResultTemplateInteractor } from '../interactors/laboratoryResultTemplateInteractor';

export class LaboratoryResultTemplateHandler {
  public static getTemplate: Lifecycle.Method = async (
    request
  ): Promise<LabResultTemplate> => {
    const study = request.params['studyName'] as unknown;
    if (typeof study !== 'string') {
      throw badRequest('invalid study');
    }

    return await LaboratoryResultTemplateInteractor.getTemplate(study);
  };

  public static updateTemplate: Lifecycle.Method = async (
    request
  ): Promise<LabResultTemplate> => {
    const study = request.params['studyName'] as unknown;
    if (typeof study !== 'string') {
      throw badRequest('invalid study');
    }

    const payload = request.payload as LabResultTemplate;

    return await LaboratoryResultTemplateInteractor.updateTemplate(
      study,
      payload
    );
  };
}
