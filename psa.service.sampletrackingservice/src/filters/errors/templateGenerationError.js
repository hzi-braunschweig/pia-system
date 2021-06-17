class TemplateGenerationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TemplateGenerationError';
  }
}

module.exports = TemplateGenerationError;
