const TemplateSegmentTypes = require('./templateSegmentTypes');

const generateTemplatesFilter = (function () {
  const consumesType = TemplateSegmentTypes.PLACEHOLDER;
  const producesType = TemplateSegmentTypes.HTML_TEMPLATE;

  const templateGenerators = new Map([
    [
      'pia-laboratory-result-table',
      require('./templateGenerators/generateLaboratoryResultTableTemplate'),
    ],
  ]);

  function generateTemplates(segment) {
    if (
      segment.type !== consumesType ||
      !templateGenerators.has(segment.element.name)
    ) {
      return segment;
    }
    const templateGenerator = templateGenerators.get(segment.element.name);

    return {
      type: producesType,
      content: templateGenerator(segment.element),
    };
  }

  return function (templatePipelineDocument) {
    return {
      ...templatePipelineDocument,
      segments: templatePipelineDocument.segments.map(generateTemplates),
    };
  };
})();

module.exports = generateTemplatesFilter;
