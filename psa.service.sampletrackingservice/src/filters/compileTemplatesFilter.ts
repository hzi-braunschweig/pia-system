/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as Mustache from 'mustache';
import { PipelineDocument } from './model/pipelineDocument';
import { Segment } from './model/segment';
import { TEMPLATE_SEGMENT_TYPES } from './templateSegmentTypes';

const consumesType = TEMPLATE_SEGMENT_TYPES.HTML_TEMPLATE;
const producesType = TEMPLATE_SEGMENT_TYPES.HTML;

function compileTemplates(segment: Segment, entity: unknown): Segment {
  if (segment.type !== consumesType) {
    return segment;
  }
  return {
    type: producesType,
    content: Mustache.render(segment.content, entity),
  };
}

export function compileTemplatesFilter(
  templatePipelineDocument: PipelineDocument
): PipelineDocument {
  return {
    ...templatePipelineDocument,
    segments: templatePipelineDocument.segments.map((segment) =>
      compileTemplates(segment, templatePipelineDocument.entity)
    ),
  };
}
