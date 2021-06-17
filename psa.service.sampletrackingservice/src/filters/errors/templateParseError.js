class TemplateParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TemplateParseError';
  }
}

module.exports = TemplateParseError;
