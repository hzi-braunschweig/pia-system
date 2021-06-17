const marked = require('marked');
const TemplateSegmentTypes = require('./templateSegmentTypes');

const compileMarkdownFilter = (function () {
  const consumesType = TemplateSegmentTypes.MARKDOWN_TEMPLATE;
  const producesType = TemplateSegmentTypes.HTML_TEMPLATE;

  function compileMarkdown(segment) {
    if (segment.type !== consumesType) {
      return segment;
    }
    return { type: producesType, content: marked(segment.content) };
  }

  return function (templatePipelineDocument) {
    return {
      ...templatePipelineDocument,
      segments: templatePipelineDocument.segments.map(compileMarkdown),
    };
  };
})();

module.exports = compileMarkdownFilter;
