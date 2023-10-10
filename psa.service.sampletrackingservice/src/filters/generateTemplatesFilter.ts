/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TEMPLATE_SEGMENT_TYPES } from './templateSegmentTypes';
import { generateLaboratoryResultTableTemplate } from './templateGenerators/generateLaboratoryResultTableTemplate';
import { Segment } from './model/segment';
import { PipelineDocument } from './model/pipelineDocument';

const consumesType = TEMPLATE_SEGMENT_TYPES.PLACEHOLDER;
const producesType = TEMPLATE_SEGMENT_TYPES.HTML_TEMPLATE;

const templateGenerators = new Map([
  ['pia-laboratory-result-table', generateLaboratoryResultTableTemplate],
]);

function generateTemplates(segment: Segment): Segment {
  const element = segment.element;
  if (!element) {
    return segment;
  }

  const templateGenerator = templateGenerators.get(element.name);
  if (segment.type !== consumesType || !templateGenerator) {
    return segment;
  }

  return {
    type: producesType,
    content: templateGenerator(element),
  };
}

export function generateTemplatesFilter(
  templatePipelineDocument: PipelineDocument
): PipelineDocument {
  return {
    ...templatePipelineDocument,
    segments: templatePipelineDocument.segments.map(generateTemplates),
  };
}
