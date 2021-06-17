const {
  MarkdownDocument,
  MarkdownCompiler,
  HtmlParser,
  DomSegmenter,
} = require('@pia/lib-templatepipeline');

const templateTags = require('./templateCustomTags/templateTagsList');

class TextSegmentationPipe {
  /**
   * Segments a text into Html and Custom segments
   * @param text {string}
   * @return {Promise<import('@pia/lib-templatepipeline').TemplateSegment[]>}
   */
  static async segment(text) {
    return new MarkdownDocument(text)
      .pipe(new MarkdownCompiler(templateTags))
      .pipe(new HtmlParser())
      .pipe(new DomSegmenter()).segments;
  }
}

module.exports = TextSegmentationPipe;
