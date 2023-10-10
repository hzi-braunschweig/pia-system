/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { LabResultTemplate } from '../models/labResultTemplate';
import { LabResultTemplateService } from '../services/labResultTemplateService';

export class LaboratoryResultTemplateInteractor {
  public static async getTemplate(study: string): Promise<LabResultTemplate> {
    return { markdownText: await LabResultTemplateService.getTemplate(study) };
  }

  public static async updateTemplate(
    study: string,
    template: LabResultTemplate
  ): Promise<LabResultTemplate> {
    return await LabResultTemplateService.updateTemplate(
      study,
      template.markdownText
    );
  }
}
