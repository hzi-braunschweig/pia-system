/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { HashService } from '../../services/hashService';
import { TemplateGenerationError } from '../errors/templateGenerationError';
import { SegmentElement } from '../model/segmentElement';
import { generateLaboratoryResultTableTemplate } from './generateLaboratoryResultTableTemplate';

const expect = require('chai').expect;

describe('generateLaboratoryResultTableTemplate', () => {
  const validHeaderSegment: SegmentElement = {
    name: 'pia-laboratory-result-table-header',
    attributes: [
      { key: 'title', value: 'headerTitle' },
      { key: 'attributeName', value: '.headerAttributeName' },
    ],
    children: [],
  };
  const headerSegmentWithoutTitleAttribute: SegmentElement = {
    name: 'pia-laboratory-result-table-header',
    attributes: [{ key: 'attributeName', value: '.headerAttributeName' }],
    children: [],
  };
  const headerSegmentWithoutAttributeNameAttribute: SegmentElement = {
    name: 'pia-laboratory-result-table-header',
    attributes: [{ key: 'title', value: 'headerTitle' }],
    children: [],
  };

  const validEntrySegment: SegmentElement = {
    name: 'pia-laboratory-result-table-entry',
    attributes: [{ key: 'name', value: 'Adenovirus-PCR (resp.)' }],
    children: [],
  };
  const entrySegmentWithoutNameAttribute: SegmentElement = {
    name: 'pia-laboratory-result-table-entry',
    attributes: [],
    children: [],
  };

  const validSegmentFixture: SegmentElement = {
    name: 'table',
    attributes: [],
    children: [validHeaderSegment, validEntrySegment],
  };

  it('should generate the table template respecting the header and entry tags', () => {
    const table = generateLaboratoryResultTableTemplate(validSegmentFixture);
    const nameHash = HashService.createMd5Hash(
      validEntrySegment.attributes[0]!.value
    );

    expect(table).to.include('headerTitle');
    expect(table).to.include(`${nameHash}.headerAttributeName`);
    expect(table).to.equal(
      '<table class="pia-laboratory-result-table"><tr><th>headerTitle</th></tr>{{#lab_observations.f678e3e6505f2d5b38b8d912586281bb}}<tr><td>{{lab_observations.f678e3e6505f2d5b38b8d912586281bb.headerAttributeName}}</td></tr>{{/lab_observations.f678e3e6505f2d5b38b8d912586281bb}}</table>'
    );
  });

  it('should generate the table template with the name of a column if attributeName = "key" of a specific header', () => {
    const segment = {
      ...validSegmentFixture,
      children: [
        ...validSegmentFixture.children,
        {
          name: 'pia-laboratory-result-table-header',
          attributes: [
            { key: 'title', value: 'Row with names of the column' },
            { key: 'attributeName', value: 'key' },
          ],
          children: [],
        },
      ],
    };

    const table = generateLaboratoryResultTableTemplate(segment);

    expect(table).to.include(validEntrySegment.attributes[0]!.value);
    expect(table).to.equal(
      '<table class="pia-laboratory-result-table"><tr><th>headerTitle</th><th>Row with names of the column</th></tr>{{#lab_observations.f678e3e6505f2d5b38b8d912586281bb}}<tr><td>{{lab_observations.f678e3e6505f2d5b38b8d912586281bb.headerAttributeName}}</td><td>Adenovirus-PCR (resp.)</td></tr>{{/lab_observations.f678e3e6505f2d5b38b8d912586281bb}}</table>'
    );
  });

  const invalidChildren = [
    headerSegmentWithoutTitleAttribute,
    headerSegmentWithoutAttributeNameAttribute,
    entrySegmentWithoutNameAttribute,
  ];
  invalidChildren.forEach((invalidChild) => {
    it('should throw an error if a tag does not contain all mandatory attributes', () => {
      const invalidSegment = {
        ...validSegmentFixture,
        children: [...validSegmentFixture.children, invalidChild],
      };
      expect(() =>
        generateLaboratoryResultTableTemplate(invalidSegment)
      ).to.throw(TemplateGenerationError, /attribute is missing/);
    });
  });
});
