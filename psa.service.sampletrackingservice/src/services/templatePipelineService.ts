/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import compileMarkdownFilter from '../filters/compileMarkdownFilter';
import parsePlaceholdersFilter from '../filters/parsePlaceholdersFilter';
import compileTemplatesFilter from '../filters/compileTemplatesFilter';
import aggregateHtmlFilter from '../filters/aggregateHtmlFilter';
import generateTemplatesFilter from '../filters/generateTemplatesFilter';
import TemplateSegmentTypes from '../filters/templateSegmentTypes';
import mapLaboratoryResult from './mapLaboratoryResult';
import { LabResult } from '../models/LabResult';
import { assert } from 'ts-essentials';

/**
 * Generates labresult documents based on Markdown templates
 */
export class TemplatePipelineService {
  /**
   * generates a laboratory result HTML string
   */
  public static generateLaboratoryResult(
    labResult: LabResult,
    template: string
  ): string {
    const templatePipelineDocument = {
      entity: mapLaboratoryResult(labResult),
      segments: [
        {
          type: TemplateSegmentTypes.MARKDOWN_TEMPLATE,
          content: template,
        },
      ],
    };

    const segment = TemplatePipelineService.templatePipeline(
      templatePipelineDocument
    ).segments[0];
    assert(segment);
    return segment.content;
  }

  /**
   * applies given TemplateSegmentFilters to a TemplatePipelineDocument
   */
  private static templatePipeline<T>(templatePipelineDocument: T): T {
    const steps = [
      compileMarkdownFilter, // [MARKDOWN_TEMPLATE] -> [HTML_TEMPLATE]
      parsePlaceholdersFilter, // [HTML_TEMPLATE] -> [HTML_TEMPLATE, PLACEHOLDER, ...]
      generateTemplatesFilter, // [PLACEHOLDER] -> [HTML_TEMPLATE]
      aggregateHtmlFilter, // [HTML_TEMPLATE, HTML_TEMPLATE] -> [HTML_TEMPLATE]
      compileTemplatesFilter, // [HTML_TEMPLATE] -> [HTML]
    ];

    return steps.reduce(
      (document, filter) => filter(document) as T,
      templatePipelineDocument
    );
  }
}
