const compileMarkdownFilter = require('../filters/compileMarkdownFilter');
const parsePlaceholdersFilter = require('../filters/parsePlaceholdersFilter');
const compileTemplatesFilter = require('../filters/compileTemplatesFilter');
const aggregateHtmlFilter = require('../filters/aggregateHtmlFilter');
const generateTemplatesFilter = require('../filters/generateTemplatesFilter');
const TemplateSegmentTypes = require('../filters/templateSegmentTypes');
const mapLaboratoryResult = require('./mapLaboratoryResult');

/**
 * Generates labresult documents based on Markdown templates
 *
 * @type {{generateLaboratoryResult: (function(*=, *=): string)}}
 */
const templatePipelineService = (function () {
  function generateLaboratoryResult(labResult, template) {
    const templatePipelineDocument = {
      entity: mapLaboratoryResult(labResult),
      segments: [
        {
          type: TemplateSegmentTypes.MARKDOWN_TEMPLATE,
          content: template,
        },
      ],
    };
    return templatePipeline(templatePipelineDocument).segments[0].content;
  }

  /**
   * Returns a function which applies given TemplateSegmentFilters to a TemplatePipelineDocument
   *
   * @param templatePipelineDocument
   * @returns {function(*=): *}
   */
  function templatePipeline(templatePipelineDocument) {
    return pipeline(
      compileMarkdownFilter, // [MARKDOWN_TEMPLATE] -> [HTML_TEMPLATE]
      parsePlaceholdersFilter, // [HTML_TEMPLATE] -> [HTML_TEMPLATE, PLACEHOLDER, ...]
      generateTemplatesFilter, // [PLACEHOLDER] -> [HTML_TEMPLATE]
      aggregateHtmlFilter, // [HTML_TEMPLATE, HTML_TEMPLATE] -> [HTML_TEMPLATE]
      compileTemplatesFilter // [HTML_TEMPLATE] -> [HTML]
    )(templatePipelineDocument);
  }

  /**
   * Helper method which applies given functions to a given input in order
   *
   * @param fns Functions to apply
   * @returns {function(*=): *}
   */
  function pipeline(...fns) {
    return function (input) {
      return fns.reduce((document, filter) => filter(document), input);
    };
  }

  return {
    /**
     * @function
     * @description generates a laboratory result HTML string
     * @param labResult LaboratoryResult instance to insert into the template
     * @param template Markdown template which should be converted to HTML
     * @memberof module:templatePipelineService
     */
    generateLaboratoryResult: generateLaboratoryResult,
  };
})();

module.exports = templatePipelineService;
