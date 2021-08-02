/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Mustache = require('mustache');
const TemplateSegmentTypes = require('./templateSegmentTypes');

const compileTemplatesFilter = (function () {
  const consumesType = TemplateSegmentTypes.HTML_TEMPLATE;
  const producesType = TemplateSegmentTypes.HTML;

  function compileTemplates(segment, entity) {
    if (segment.type !== consumesType) {
      return segment;
    }
    return {
      type: producesType,
      content: Mustache.render(segment.content, entity),
    };
  }

  return function (templatePipelineDocument) {
    return {
      ...templatePipelineDocument,
      segments: templatePipelineDocument.segments.map((segment) =>
        compileTemplates(segment, templatePipelineDocument.entity)
      ),
    };
  };
})();

module.exports = compileTemplatesFilter;
