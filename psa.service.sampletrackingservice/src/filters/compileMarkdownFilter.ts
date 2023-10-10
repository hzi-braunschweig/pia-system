/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { marked } from 'marked';

import { PipelineDocument } from './model/pipelineDocument';
import { Segment } from './model/segment';
import { TEMPLATE_SEGMENT_TYPES } from './templateSegmentTypes';

const consumesType = TEMPLATE_SEGMENT_TYPES.MARKDOWN_TEMPLATE;
const producesType = TEMPLATE_SEGMENT_TYPES.HTML_TEMPLATE;

function compileMarkdown(segment: Segment): Segment {
  if (segment.type !== consumesType) {
    return segment;
  }
  return { type: producesType, content: marked(segment.content) };
}

export function compileMarkdownFilter(
  templatePipelineDocument: PipelineDocument
): PipelineDocument {
  return {
    ...templatePipelineDocument,
    segments: templatePipelineDocument.segments.map(compileMarkdown),
  };
}
