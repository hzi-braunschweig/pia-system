/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HashService } from '../../services/hashService';
import { TemplateGenerationError } from '../errors/templateGenerationError';
import { SegmentElement } from '../model/segmentElement';

interface TableHeader {
  title: string;
  attributeName: string;
}

export function generateLaboratoryResultTableTemplate(
  element: SegmentElement
): string {
  const headers = getTableHeader(element);

  const headersWithTags = headers
    .map((header) => `<th>${header.title}</th>`)
    .join('');
  let template = `<table class="pia-laboratory-result-table"><tr>${headersWithTags}</tr>`;

  element.children.forEach((child) => {
    if (child.name !== 'pia-laboratory-result-table-header') {
      const nameAttribute = child.attributes.find(
        (attribute) => attribute.key === 'name'
      );

      if (!nameAttribute) {
        throw new TemplateGenerationError(
          'name attribute is missing in one table entry'
        );
      }

      const nameHash = HashService.createMd5Hash(nameAttribute.value);

      const columnWithTags = headers
        .map(
          (header) =>
            `<td>${
              header.attributeName === 'key'
                ? nameAttribute.value
                : `{{lab_observations.${nameHash}${header.attributeName}}}`
            }</td>`
        )
        .join('');

      template += `{{#lab_observations.${nameHash}}}<tr>${columnWithTags}</tr>{{/lab_observations.${nameHash}}}`;
    }
  });

  template += '</table>';
  return template;
}

function getTableHeader(element: SegmentElement): TableHeader[] {
  let headers: TableHeader[] = [];
  element.children.forEach((child) => {
    if (child.name === 'pia-laboratory-result-table-header') {
      const titleAttribute = child.attributes.find(
        (attribute) => attribute.key === 'title'
      );
      const attributeNameAttribute = child.attributes.find(
        (attribute) => attribute.key === 'attributeName'
      );

      if (!titleAttribute || !attributeNameAttribute) {
        throw new TemplateGenerationError(
          'title or attributeName attribute is missing in one table header'
        );
      }

      headers.push({
        title: titleAttribute.value,
        attributeName: attributeNameAttribute.value,
      });
    }
  });

  if (headers.length === 0) {
    headers = [
      { title: 'PCR', attributeName: 'key' },
      { title: 'Ergebnis', attributeName: '.result' },
      { title: 'Analysis Datum', attributeName: '.date_of_analysis' },
      { title: 'Eingang der Probe', attributeName: '.date_of_delivery' },
      {
        title: 'Datum der Ergebnismitteilung',
        attributeName: '.date_of_announcement',
      },
    ];
  }

  return headers;
}
