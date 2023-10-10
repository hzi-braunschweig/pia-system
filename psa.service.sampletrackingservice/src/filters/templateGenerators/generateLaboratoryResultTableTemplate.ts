/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HashService } from '../../services/hashService';
import { TemplateGenerationError } from '../errors/templateGenerationError';
import { SegmentElement } from '../model/segmentElement';

export function generateLaboratoryResultTableTemplate(
  element: SegmentElement
): string {
  let template =
    '<table class="pia-laboratory-result-table"><tr><th>PCR</th><th>Ergebnis</th><th>Analysis Datum</th><th>Eingang der Probe</th><th>Datum der Ergebnismitteilung</th></tr>';
  element.children.forEach((child) => {
    const nameAttribute = child.attributes.find(
      (attribute) => attribute.key === 'name'
    );

    if (!nameAttribute) {
      throw new TemplateGenerationError(
        'name attribute is missing in one table entry'
      );
    }

    const nameHash = HashService.createMd5Hash(nameAttribute.value);

    template +=
      '{{#lab_observations.' +
      nameHash +
      '}}<tr>' +
      '<td>' +
      nameAttribute.value +
      '</td>' +
      '<td>{{lab_observations.' +
      nameHash +
      '.result}}</td>' +
      '<td>{{lab_observations.' +
      nameHash +
      '.date_of_analysis}}</td>' +
      '<td>{{lab_observations.' +
      nameHash +
      '.date_of_delivery}}</td>' +
      '<td>{{lab_observations.' +
      nameHash +
      '.date_of_announcement}}</td>' +
      '</tr>{{/lab_observations.' +
      nameHash +
      '}}';
  });
  template += '</table>';
  return template;
}
