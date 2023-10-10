/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { PipelineDocument } from './model/pipelineDocument';
import { Segment } from './model/segment';
import { TEMPLATE_SEGMENT_TYPES } from './templateSegmentTypes';

function aggregateHtmlSegments(segments: Segment[]): Segment[] {
  const aggregatedSegments: Segment[] = [];
  segments.forEach((segment) => {
    const last = aggregatedSegments[aggregatedSegments.length - 1];
    if (
      last &&
      last.type === TEMPLATE_SEGMENT_TYPES.HTML_TEMPLATE &&
      segment.type === TEMPLATE_SEGMENT_TYPES.HTML_TEMPLATE
    ) {
      last.content += segment.content;
    } else {
      aggregatedSegments.push(segment);
    }
  });
  return aggregatedSegments;
}

export function aggregateHtmlFilter(
  templatePipelineDocument: PipelineDocument
): PipelineDocument {
  return {
    ...templatePipelineDocument,
    segments: aggregateHtmlSegments(templatePipelineDocument.segments),
  };
}
