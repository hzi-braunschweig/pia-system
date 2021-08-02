/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const TemplateSegmentTypes = require('./templateSegmentTypes');

const aggregateHtmlFilter = (function () {
  function aggregateHtmlSegments(segments) {
    const aggregatedSegments = [];
    segments.forEach((segment) => {
      if (
        aggregatedSegments.length !== 0 &&
        aggregatedSegments[aggregatedSegments.length - 1].type ===
          TemplateSegmentTypes.HTML_TEMPLATE &&
        segment.type === TemplateSegmentTypes.HTML_TEMPLATE
      ) {
        aggregatedSegments[aggregatedSegments.length - 1].content +=
          segment.content;
      } else {
        aggregatedSegments.push(segment);
      }
    });
    return aggregatedSegments;
  }

  return function (templatePipelineDocument) {
    return {
      ...templatePipelineDocument,
      segments: aggregateHtmlSegments(templatePipelineDocument.segments),
    };
  };
})();

module.exports = aggregateHtmlFilter;
